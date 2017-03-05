// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require( 'vscode' ),
    path = require( 'path' ),
    exec = require( 'child_process' ).execSync;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate( context )
{
    var disposable = vscode.commands.registerCommand( 'extension.closeUnmodifiedEditors', function()
    {
        function abort()
        {
            if( tracker )
            {
                tracker.dispose();
            }
        }

        var aborter = setTimeout( abort, 3000 );

        if( vscode.window.activeTextEditor === undefined )
        {
            return false;
        }

        var activePath = vscode.window.activeTextEditor.document.uri.path;

        var tracker = vscode.window.onDidChangeActiveTextEditor( function()
        {
            var editor = vscode.window.activeTextEditor;

            if( editor )
            {
                if( editor.document.isDirty === false )
                {
                    var filepath = editor.document.uri.path;
                    var folder = path.dirname( filepath );
                    var name = path.basename( filepath );

                    var status = exec( 'cd ' + folder + '; git status -z ' + name );
                    if( status === undefined || ( status + "" ).trim() === "" )
                    {
                        vscode.commands.executeCommand( "workbench.action.closeActiveEditor" );
                    }
                }

                if( editor.document.uri.path != activePath )
                {
                    vscode.commands.executeCommand( "workbench.action.nextEditor" );
                }
                else
                {
                    clearTimeout( aborter );
                    tracker.dispose();
                }
            }
        } );

        vscode.commands.executeCommand( "workbench.action.nextEditor" );
    } );

    context.subscriptions.push( disposable );
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate()
{
}
exports.deactivate = deactivate;