function createMenu(app) 
{
    // Build menu from template
    let mainMenuTemplate = [
        {
            label:'File',
            submenu:[
                {
                    label: 'Quit',
                    accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                    click() {
                        app.quit();
                    }
                }
            ]
        }
    ];
    // Add developer tools item if not in prod
    if(process.env.NODE_ENV !== 'production') {
        mainMenuTemplate.push({
            label: 'Developer Tools',
            submenu: [
                {
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform == 'darwin' ? 'Command+Shift+I' : 'Ctrl+Shift+I',
                    click(item, focusedWindow) {
                        focusedWindow.toggleDevTools();
                    }
                },
                {
                    role: 'reload'
                }
            ]
        });
    }
    // If macOS, add empty object to menu.
    if (process.platform == "darwin") {
        mainMenuTemplate.unshift({});
    }
    return mainMenuTemplate;
}

function exportVars() 
{
    module.exports.getMenu = function(app) {
        return createMenu(app);
    };
}

exportVars();