# Canvas RPG Website

A gamified task management system that turns your to-do list into an RPG adventure!

## Features

- **Task Management**: Add, complete, and track your tasks as quests
- **RPG Elements**: Gain XP, level up, and defeat bosses as you complete tasks
- **Animated Knight**: Watch your knight character perform random animations and attack the boss
- **Persistent Progress**: Your game state is saved in your browser's local storage
- **Responsive Design**: Works on desktop and mobile devices
- **Canvas LMS Integration**: Import your assignments directly from Canvas

## How to Use

1. **Add Tasks**: Enter your tasks in the quest section with optional due dates
2. **Complete Tasks**: Check off tasks to gain XP and progress in the game
3. **Attack Boss**: Use your accumulated XP to attack the boss
4. **Level Up**: As you gain XP, you'll level up and become more powerful
5. **Adjust Settings**: Customize your experience in the settings panel
6. **Import from Canvas**: Connect to Canvas LMS to import your assignments as quests

## Canvas Integration

To import tasks from Canvas LMS:

1. Go to your Canvas account settings
2. Generate a new access token under "Approved Integrations"
3. In the Canvas RPG settings, enter your Canvas domain (e.g., `your-school.instructure.com`)
4. Enter your access token
5. Click "Import Tasks from Canvas"

Note: Due to browser security restrictions (CORS), direct Canvas API access may not work in all environments. If you encounter issues, you can use the manual import option that appears automatically.

## Technical Details

This website is built with vanilla HTML, CSS, and JavaScript. It uses:

- Local Storage API for saving game state
- CSS animations for visual effects
- Responsive design principles for cross-device compatibility
- Canvas LMS API integration for importing tasks

## Installation

Simply open the `index.html` file in a web browser to start using the application. No server or installation required!

## Credits

- Pixel art assets created for Canvas RPG
- Font: "Press Start 2P" from Google Fonts

## License

This project is available for personal use. 