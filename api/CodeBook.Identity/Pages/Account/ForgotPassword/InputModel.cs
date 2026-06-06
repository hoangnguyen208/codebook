using System.ComponentModel.DataAnnotations;

namespace CodeBook.Identity.Pages.Account.ForgotPassword;

public class InputModel
{
    [Required(ErrorMessage = "Please enter your username or email address.")]
    [Display(Name = "Username or email")]
    public string? UsernameOrEmail { get; set; }

    public string? ReturnUrl { get; set; }
}
