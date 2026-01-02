using Microsoft.EntityFrameworkCore;
using ReState.Data;
using ReState.Entities;

namespace ReState.Services
{
    public class PropertyService : IPropertyService  
    {
        private readonly ApplicationDbContext _context;

        public PropertyService(ApplicationDbContext context)
        {
            _context = context;
        }


      
        public async Task<IEnumerable<Property>> GetAllPropertiesAsync()
        {
            return await _context.Properties.ToListAsync();
        }


 
        public async Task<Property?> GetPropertyByIdAsync(int id)
        {
            return await _context.Properties.FindAsync(id);
        }



        public async Task<Property> CreatePropertyAsync(Property property, Guid userId)
        {
            property.UserId = userId;
            await _context.Properties.AddAsync(property);
            await _context.SaveChangesAsync();
            return property;
        }



        public async Task<Property?> UpdatePropertyAsync(int id, Property updatedProperty, Guid userId)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null || property.UserId != userId)
                return null;

            property.Title = updatedProperty.Title;
            property.Description = updatedProperty.Description;
            property.Price = updatedProperty.Price;
            property.Address = updatedProperty.Address;
            property.ImageUrls = updatedProperty.ImageUrls;
            property.Bedrooms = updatedProperty.Bedrooms;
            property.Bathrooms = updatedProperty.Bathrooms;
            property.Area = updatedProperty.Area;
            property.PropertyType = updatedProperty.PropertyType;
            property.Status = updatedProperty.Status;
            property.UpdatedAt = DateTime.UtcNow;

            _context.Properties.Update(property);
            await _context.SaveChangesAsync();
            return property;
        }



        public async Task<Property?> DeletePropertyAsync(int id, Guid userId)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null || property.UserId != userId)
                return null;

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();
            return property;
        }



    }
}