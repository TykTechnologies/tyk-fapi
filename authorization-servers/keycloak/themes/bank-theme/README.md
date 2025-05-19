# Bank Theme for Keycloak

This custom theme changes the Keycloak login page to use banking terminology:
- "Username" is replaced with "Personal ID" (10-digit number)
- "Password" is replaced with "Security Number" (5-digit number)

The theme also includes minimal styling improvements:
- Contained width for the login card (not full-width on desktop)
- Subtle shadow and rounded corners
- Responsive design that adapts to different screen sizes

This approach focuses on simplicity and compatibility with Keycloak's existing styling.

## How to Apply the Theme

1. Start or restart Keycloak with the updated docker-compose.yaml file:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. Access the Keycloak Admin Console:
   - URL: http://localhost:8081/admin/
   - Username: admin
   - Password: admin

3. Configure the realm to use the custom theme:
   - Navigate to the "fapi-demo" realm (or create it if it doesn't exist)
   - Go to "Realm Settings" > "Themes" tab
   - Set "Login Theme" to "bank-theme"
   - Click "Save"

4. Test the login page:
   - Access the login page at: http://localhost:8081/realms/fapi-demo/account/
   - Verify that "Personal ID" and "Security Number" are displayed instead of "Username" and "Password"

## Customization

If you need to make further customizations:

- Edit `login/messages/messages_en.properties` to change text labels
- Edit `login/resources/css/login.css` to modify styling
- Restart Keycloak after making changes

## Troubleshooting

- If the theme doesn't appear, check that the volume is correctly mounted in docker-compose.yaml
- Verify that the theme directory structure is correct
- Check Keycloak logs for any errors related to theme loading