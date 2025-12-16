# TODO: Implement Login and Registration System

## Tasks
- [x] Create login.html with login form
- [x] Create register.html with registration form
- [x] Modify consultoria.html to check login status and redirect if not logged in
- [x] Add logout functionality to consultoria.html navbar
- [x] Add console.log statements for debugging login flow
- [x] Disable login check for fictional direct access demo
- [x] Test the complete flow: Register -> Login -> Access -> Logout (Completed with hardcoded credentials for demo)

## Details
- Use localStorage for storing user credentials (plain text for simplicity)
- Login form: username and password fields, submit button
- Register form: username and password fields, confirm password, submit button
- On successful login/register, redirect to consultoria.html
- On consultoria.html load, check if 'loggedIn' is 'true' in localStorage, else redirect to login.html
- Add logout button in navbar that sets 'loggedIn' to 'false' and redirects to login.html
- Style with Bootstrap to match existing theme
