import CustomButton from "@/components/CustomButton";
import icons from "@/constants/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BlogArticle {
  id: number;
  title: string;
  summary: string;
  category: string;
  imageUrl: string;
  viewCount: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
}

interface ArticleForm {
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string;
  readTimeMinutes: string;
  isFeatured: boolean;
  isPublished: boolean;
}

export default function AdminBlogManagerScreen() {
  const { user } = useAuth();
  const { showAlert, showToast } = useAlert();
  const handleBack = useBackNavigation("/(root)/(tabs)/profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");
  const [form, setForm] = useState<ArticleForm>({
    title: "",
    content: "",
    summary: "",
    category: "Market Trends",
    tags: "",
    readTimeMinutes: "5",
    isFeatured: false,
    isPublished: true,
  });

  useEffect(() => {
    if (user?.role !== "Admin") {
      showAlert({
        type: "error",
        title: "Access Denied",
        message: "You must be an admin to access this page",
      });
      handleBack();
      return;
    }
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Blog?pageSize=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles);
      }
    } catch (error) {
      console.error("Error loading articles:", error);
      showToast("Failed to load articles", "error");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        showAlert({
          type: "error",
          title: "Permission Required",
          message: "Please grant camera roll permissions to upload images",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showToast("Failed to pick image", "error");
    }
  };
  const handleCreateOrUpdate = async () => {
    // 1. Validation
    if (!form.title.trim() || !form.content.trim() || !form.summary.trim()) {
      showAlert({
        type: "error",
        title: "Error",
        message: "Please fill in all required fields",
      });
      return;
    }

    // If creating new, an image is required. If editing, it's optional.
    if (!editingId && !selectedImage) {
      showAlert({
        type: "error",
        title: "Error",
        message: "Please select an image for the article",
      });
      return;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("accessToken");

      // 2. Define the URL (This fixes your 'cannot find name url' error)
      const url = editingId
        ? `${process.env.EXPO_PUBLIC_API_URL}/api/Blog/${editingId}`
        : `${process.env.EXPO_PUBLIC_API_URL}/api/Blog`;

      // 3. Create FormData
      const formData = new FormData();
      // Append text fields with explicit string conversion
      formData.append("Title", form.title.trim());
      formData.append("Content", form.content.trim());
      formData.append("Summary", form.summary.trim());
      formData.append("Category", form.category.trim());
      formData.append("Tags", form.tags.trim());

      // Convert ReadTimeMinutes to a string integer
      formData.append(
        "ReadTimeMinutes",
        parseInt(form.readTimeMinutes || "5", 10).toString()
      );

      // IMPORTANT: Use lowercase "true"/"false" for .NET Boolean binding
      formData.append("IsFeatured", form.isFeatured ? "true" : "false");
      formData.append("IsPublished", form.isPublished ? "true" : "false");

      // 4. Handle Image
      if (selectedImage) {
        const uri = selectedImage.uri;
        const filename = uri.split("/").pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        // We cast to 'any' because React Native's FormData expects an object
        // with uri, name, and type, which doesn't strictly match the Web standard 'Blob'
        formData.append("Image", {
          uri,
          name: filename,
          type,
        } as any);
      }
      console.log("----------------------------");
      console.log("FormData content check:");
      if ((formData as any)._parts) {
        for (let key of (formData as any)._parts) {
          console.log(`${key[0]}:`, key[1]);
        }
      }
      console.log("----------------------------");
      // 5. Execute Request
      console.log(`📤 Sending ${editingId ? "PUT" : "POST"} request to:`, url);

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // 6. Handle Response
      if (response.ok) {
        showToast(
          `Article ${editingId ? "updated" : "created"} successfully`,
          "success"
        );
        setShowModal(false);
        resetForm();
        loadArticles();
      } else {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        showAlert({
          type: "error",
          title: "Error",
          message: `Failed to save: ${response.status}`,
        });
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      showAlert({
        type: "error",
        title: "Error",
        message: error.message || "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article: BlogArticle) => {
    setEditingId(article.id);
    setExistingImageUrl(article.imageUrl);
    loadArticleForEdit(article.id);
  };

  const loadArticleForEdit = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/Blog/${id}`
      );

      if (response.ok) {
        const article = await response.json();
        setForm({
          title: article.title,
          content: article.content,
          summary: article.summary,
          category: article.category,
          tags: Array.isArray(article.tags) ? article.tags.join(", ") : "",
          readTimeMinutes: article.readTimeMinutes.toString(),
          isFeatured: article.isFeatured,
          isPublished: true,
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error loading article:", error);
      showToast("Failed to load article for editing", "error");
    }
  };

  const handleDelete = (id: number) => {
    showAlert({
      type: "warning",
      title: "Delete Article",
      message:
        "Are you sure you want to delete this article? The image will also be removed from storage.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("accessToken");
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/api/Blog/${id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                showToast("Article deleted successfully", "success");
                loadArticles();
              } else {
                const errorData = await response.json();
                showAlert({
                  type: "error",
                  title: "Error",
                  message: errorData.message || "Failed to delete article",
                });
              }
            } catch (error) {
              console.error("Error deleting article:", error);
              showToast("Failed to delete article", "error");
            }
          },
        },
      ],
    });
  };

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      summary: "",
      category: "Market Trends",
      tags: "",
      readTimeMinutes: "5",
      isFeatured: false,
      isPublished: true,
    });
    setEditingId(null);
    setSelectedImage(null);
    setExistingImageUrl("");
  };

  const renderArticle = ({ item }: { item: BlogArticle }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex flex-row mb-2">
        <Image
          source={{ uri: item.imageUrl }}
          className="w-20 h-20 rounded-lg mr-3"
          resizeMode="cover"
        />
        <View className="flex-1">
          <Text
            className="text-base font-rubik-bold text-black-300 mb-1"
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text className="text-black-200 text-sm font-rubik" numberOfLines={2}>
            {item.summary}
          </Text>
        </View>
      </View>

      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-row items-center">
          <View className="bg-primary-100 px-2 py-1 rounded-full mr-2">
            <Text className="text-primary-300 text-xs font-rubik">
              {item.category}
            </Text>
          </View>
          {item.isFeatured && (
            <View className="bg-yellow-100 px-2 py-1 rounded-full mr-2">
              <Text className="text-yellow-600 text-xs font-rubik">
                Featured
              </Text>
            </View>
          )}
          <Text className="text-black-200 text-xs font-rubik">
            {item.viewCount} views
          </Text>
        </View>

        <View className="flex flex-row">
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            className="bg-primary-100 p-2 rounded-lg mr-2"
          >
            <Text className="text-primary-300 font-rubik-medium text-xs">
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            className="bg-red-100 p-2 rounded-lg"
          >
            <Text className="text-red-500 font-rubik-medium text-xs">
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="h-full bg-white flex items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full bg-white">
      <View className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-rubik-bold text-black-300">
            Blog Manager
          </Text>
          <Text className="text-black-200 font-rubik">
            {articles.length} articles
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-primary-300 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-rubik-medium">+ New Article</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="py-10 items-center">
            <Text className="text-black-200 font-rubik">No articles found</Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-5 py-4 flex flex-row items-center justify-between border-b border-gray-200">
            <Text className="text-xl font-rubik-bold">
              {editingId ? "Edit Article" : "New Article"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <Image source={icons.close} className="w-6 h-6" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4">
            {/* Image Upload Section */}
            <Text className="text-sm font-rubik-medium text-black-300 mb-2">
              Article Image *
            </Text>
            <TouchableOpacity
              onPress={pickImage}
              className="border-2 border-dashed border-primary-200 rounded-lg p-4 mb-4 items-center"
            >
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage.uri }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
              ) : existingImageUrl ? (
                <View className="w-full">
                  <Image
                    source={{ uri: existingImageUrl }}
                    className="w-full h-48 rounded-lg"
                    resizeMode="cover"
                  />
                  <Text className="text-primary-300 font-rubik text-center mt-2">
                    Tap to change image
                  </Text>
                </View>
              ) : (
                <View className="items-center py-8">
                  <Image
                    source={icons.plus}
                    className="w-12 h-12 mb-2"
                    tintColor="#6366F1"
                  />
                  <Text className="text-primary-300 font-rubik-medium">
                    Select Article Image
                  </Text>
                  <Text className="text-black-200 font-rubik text-xs mt-1">
                    JPG, PNG, WEBP (Max 5MB)
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text className="text-sm font-rubik-medium text-black-300 mb-2">
              Title *
            </Text>
            <TextInput
              className="border border-primary-200 rounded-lg px-4 py-3 font-rubik mb-4"
              placeholder="Article title"
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
            />

            <Text className="text-sm font-rubik-medium text-black-300 mb-2">
              Summary *
            </Text>
            <TextInput
              className="border border-primary-200 rounded-lg px-4 py-3 font-rubik mb-4"
              placeholder="Brief summary (shown in listings)"
              value={form.summary}
              onChangeText={(text) => setForm({ ...form, summary: text })}
              multiline
              numberOfLines={3}
            />

            <Text className="text-sm font-rubik-medium text-black-300 mb-2">
              Content *
            </Text>
            <TextInput
              className="border border-primary-200 rounded-lg px-4 py-3 font-rubik mb-4"
              placeholder="Full article content"
              value={form.content}
              onChangeText={(text) => setForm({ ...form, content: text })}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />

            <Text className="text-sm font-rubik-medium text-black-300 mb-2">
              Category
            </Text>
            <TextInput
              className="border border-primary-200 rounded-lg px-4 py-3 font-rubik mb-4"
              placeholder="e.g., Market Trends, First-Time Buyers"
              value={form.category}
              onChangeText={(text) => setForm({ ...form, category: text })}
            />

            <Text className="text-sm font-rubik-medium text-black-300 mb-2">
              Tags (comma separated)
            </Text>
            <TextInput
              className="border border-primary-200 rounded-lg px-4 py-3 font-rubik mb-4"
              placeholder="market, trends, 2024"
              value={form.tags}
              onChangeText={(text) => setForm({ ...form, tags: text })}
            />

            <Text className="text-sm font-rubik-medium text-black-300 mb-2">
              Read Time (minutes)
            </Text>
            <TextInput
              className="border border-primary-200 rounded-lg px-4 py-3 font-rubik mb-4"
              placeholder="5"
              keyboardType="numeric"
              value={form.readTimeMinutes}
              onChangeText={(text) =>
                setForm({ ...form, readTimeMinutes: text })
              }
            />

            <TouchableOpacity
              onPress={() => setForm({ ...form, isFeatured: !form.isFeatured })}
              className="flex flex-row items-center mb-6"
            >
              <View
                className={`w-6 h-6 border-2 rounded mr-3 items-center justify-center ${
                  form.isFeatured
                    ? "bg-primary-300 border-primary-300"
                    : "border-gray-300"
                }`}
              >
                {form.isFeatured && (
                  <Text className="text-white font-rubik-bold">✓</Text>
                )}
              </View>
              <Text className="text-black-300 font-rubik">
                Featured Article
              </Text>
            </TouchableOpacity>

            <CustomButton
              title={
                saving
                  ? "Saving..."
                  : editingId
                    ? "Update Article"
                    : "Create Article"
              }
              onPress={handleCreateOrUpdate}
              className="bg-primary-300 mb-4"
              disabled={saving}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
