using ReState.Entities;

namespace ReState.Services
{
    public interface IPropertyService
    {
        Task<IEnumerable<Property>> GetAllPropertiesAsync();
        Task<Property?> GetPropertyByIdAsync(int id);
        Task<Property> CreatePropertyAsync(Property property, Guid userId);
        Task<Property?> UpdatePropertyAsync(int id, Property updatedProperty, Guid userId);
        Task<Property?> DeletePropertyAsync(int id, Guid userId);
    }
}