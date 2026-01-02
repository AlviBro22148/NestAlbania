namespace ReState.Models
{
    public class CreateReportDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpdateReportDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
    }

    public class AddPropertyToReportDto
    {
        public int PropertyId { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateReportPropertyDto
    {
        public string? Notes { get; set; }
    }

    public class ReportResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<ReportPropertyResponseDto> Properties { get; set; } = new();
    }

    public class ReportPropertyResponseDto
    {
        public int Id { get; set; }
        public int PropertyId { get; set; }
        public string? Notes { get; set; }
        public DateTime AddedAt { get; set; }
        public PropertySummaryDto? Property { get; set; }
    }

    public class PropertySummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public decimal Area { get; set; }
        public string PropertyType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Image { get; set; }
    }
}
