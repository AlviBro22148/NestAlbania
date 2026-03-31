import CustomButton from "@/components/CustomButton";
import icons from "@/constants/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import api, { getToken } from "@/lib/axios-config";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  InteractionManager,
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
  const { colors, isDark } = useTheme();
  const handleBack = useBackNavigation("/(root)/profile");
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
    const task = InteractionManager.runAfterInteractions(() => {
      loadArticles();
    });
    return () => task.cancel();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/Blog?pageSize=100");
      setArticles(response.data.articles);
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

      // Create FormData
      const formData = new FormData();
      formData.append("Title", form.title.trim());
      formData.append("Content", form.content.trim());
      formData.append("Summary", form.summary.trim());
      formData.append("Category", form.category.trim());
      formData.append("Tags", form.tags.trim());
      formData.append(
        "ReadTimeMinutes",
        parseInt(form.readTimeMinutes || "5", 10).toString(),
      );
      formData.append("IsFeatured", form.isFeatured ? "true" : "false");
      formData.append("IsPublished", form.isPublished ? "true" : "false");

      // Handle Image
      if (selectedImage) {
        const uri = selectedImage.uri;
        const filename = uri.split("/").pop() || "image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("Image", {
          uri,
          name: filename,
          type,
        } as any);
      }

      const url = editingId ? `/api/Blog/${editingId}` : "/api/Blog";

      if (editingId) {
        await api.put(url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(url, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      showToast(
        `Article ${editingId ? "updated" : "created"} successfully`,
        "success",
      );
      setShowModal(false);
      resetForm();
      loadArticles();
    } catch (error: any) {
      console.error("Upload Error:", error);
      showAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || error.message || "An unexpected error occurred",
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
      const response = await api.get(`/api/Blog/${id}`);
      const article = response.data;
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
              await api.delete(`/api/Blog/${id}`);
              showToast("Article deleted successfully", "success");
              loadArticles();
            } catch (error: any) {
              console.error("Error deleting article:", error);
              showAlert({
                type: "error",
                title: "Error",
                message: error.response?.data?.message || "Failed to delete article",
              });
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
    <View className="rounded-xl p-4 mb-3 shadow-sm" style={{ backgroundColor: colors.surface }}>
      <View className="flex flex-row mb-2">
        <Image
          source={{ uri: item.imageUrl }}
          className="w-20 h-20 rounded-lg mr-3"
          resizeMode="cover"
        />
        <View className="flex-1">
          <Text
            className="text-base font-rubik-bold mb-1"
            numberOfLines={2}
            style={{ color: colors.text }}
          >
            {item.title}
          </Text>
          <Text className="text-sm font-rubik" numberOfLines={2} style={{ color: colors.textSecondary }}>
            {item.summary}
          </Text>
        </View>
      </View>

      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-row items-center">
          <View className="px-2 py-1 rounded-full mr-2" style={{ backgroundColor: colors.primaryLight }}>
            <Text className="text-xs font-rubik" style={{ color: colors.primary }}>
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
          <Text className="text-xs font-rubik" style={{ color: colors.textSecondary }}>
            {item.viewCount} views
          </Text>
        </View>

        <View className="flex flex-row">
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            className="p-2 rounded-lg mr-2"
            style={{ backgroundColor: colors.primaryLight }}
          >
            <Text className="font-rubik-medium text-xs" style={{ color: colors.primary }}>
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
      <SafeAreaView className="h-full flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-full" style={{ backgroundColor: colors.background }}>
      <View className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-rubik-bold" style={{ color: colors.text }}>
            Blog Manager
          </Text>
          <Text className="font-rubik" style={{ color: colors.textSecondary }}>
            {articles.length} articles
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: colors.primary }}
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
            <Text className="font-rubik" style={{ color: colors.textSecondary }}>No articles found</Text>
          </View>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        statusBarTranslucent={true}
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="px-5 py-4 flex flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text className="text-xl font-rubik-bold" style={{ color: colors.text }}>
              {editingId ? "Edit Article" : "New Article"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <Image source={icons.close} className="w-6 h-6" style={{ tintColor: colors.text }} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4">
            {/* Image Upload Section */}
            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              Article Image *
            </Text>
            <TouchableOpacity
              onPress={pickImage}
              className="border-2 border-dashed rounded-lg p-4 mb-4 items-center"
              style={{ borderColor: colors.primary }}
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
                  <Text className="font-rubik text-center mt-2" style={{ color: colors.primary }}>
                    Tap to change image
                  </Text>
                </View>
              ) : (
                <View className="items-center py-8">
                  <Image
                    source={icons.plus}
                    className="w-12 h-12 mb-2"
                    tintColor={colors.primary}
                  />
                  <Text className="font-rubik-medium" style={{ color: colors.primary }}>
                    Select Article Image
                  </Text>
                  <Text className="font-rubik text-xs mt-1" style={{ color: colors.textSecondary }}>
                    JPG, PNG, WEBP (Max 5MB)
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              Title *
            </Text>
            <TextInput
              className="rounded-lg px-4 py-3 font-rubik mb-4"
              style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, color: colors.text }}
              placeholder="Article title"
              placeholderTextColor={colors.textMuted}
              value={form.title}
              onChangeText={(text) => setForm({ ...form, title: text })}
            />

            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              Summary *
            </Text>
            <TextInput
              className="rounded-lg px-4 py-3 font-rubik mb-4"
              style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, color: colors.text }}
              placeholder="Brief summary (shown in listings)"
              placeholderTextColor={colors.textMuted}
              value={form.summary}
              onChangeText={(text) => setForm({ ...form, summary: text })}
              multiline
              numberOfLines={3}
            />

            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              Content *
            </Text>
            <TextInput
              className="rounded-lg px-4 py-3 font-rubik mb-4"
              style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, color: colors.text }}
              placeholder="Full article content"
              placeholderTextColor={colors.textMuted}
              value={form.content}
              onChangeText={(text) => setForm({ ...form, content: text })}
              multiline
              numberOfLines={10}
              textAlignVertical="top"
            />

            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              Category
            </Text>
            <TextInput
              className="rounded-lg px-4 py-3 font-rubik mb-4"
              style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, color: colors.text }}
              placeholder="e.g., Market Trends, First-Time Buyers"
              placeholderTextColor={colors.textMuted}
              value={form.category}
              onChangeText={(text) => setForm({ ...form, category: text })}
            />

            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              Tags (comma separated)
            </Text>
            <TextInput
              className="rounded-lg px-4 py-3 font-rubik mb-4"
              style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, color: colors.text }}
              placeholder="market, trends, 2024"
              placeholderTextColor={colors.textMuted}
              value={form.tags}
              onChangeText={(text) => setForm({ ...form, tags: text })}
            />

            <Text className="text-sm font-rubik-medium mb-2" style={{ color: colors.text }}>
              Read Time (minutes)
            </Text>
            <TextInput
              className="rounded-lg px-4 py-3 font-rubik mb-4"
              style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated, color: colors.text }}
              placeholder="5"
              placeholderTextColor={colors.textMuted}
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
                className="w-6 h-6 border-2 rounded mr-3 items-center justify-center"
                style={{
                  backgroundColor: form.isFeatured ? colors.primary : "transparent",
                  borderColor: form.isFeatured ? colors.primary : colors.border
                }}
              >
                {form.isFeatured && (
                  <Text className="text-white font-rubik-bold">✓</Text>
                )}
              </View>
              <Text className="font-rubik" style={{ color: colors.text }}>
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
              className="mb-4"
              style={{ backgroundColor: colors.primary }}
              disabled={saving}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

