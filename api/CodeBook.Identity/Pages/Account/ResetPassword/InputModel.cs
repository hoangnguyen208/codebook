using System.ComponentModel.DataAnnotations;

namespace CodeBook.Identity.Pages.Account.ResetPassword;

public class InputModel
{
    [Required]
    [DataType(DataType.Password)]
    [Display(Name = "New password")]
    public string? Password { get; set; }

    [Required]
    [DataType(DataType.Password)]
    [Display(Name = "Confirm new password")]
    [Compare(nameof(Password), ErrorMessage = "The password and confirmation password do not match.")]
    public string? ConfirmPassword { get; set; }

    public string? UserId { get; set; }

    public string? Code { get; set; }

    public string? ReturnUrl { get; set; }
}
