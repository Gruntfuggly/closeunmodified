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

        if( vscode.window.activeTextEditor === undefined )
        {
            return false;
        }

        var activePath = vscode.window.activeTextEditor.document.uri.path;

        var toClose = [];
        var documents = vscode.workspace.textDocuments;
        documents.map( function( document, i )
        {
            vscode.window.showTextDocument( document.fileName );
            console.log( i + vscode.window.activeTextEditor.document.uri.path );

            if( document.isDirty === false )
            {
                var filepath = vscode.Uri.parse( document.uri.path ).fsPath;
                var folder = path.dirname( filepath );
                var name = path.basename( filepath );

                try
                {
                    var status = exec( 'git status -z ' + name, { cwd: folder } )

                    if( status === undefined || ( status + "" ).trim() === "" )
                    {
                        toClose.push( document );
                    }
                }
                catch( e )
                { }
            }
        } );

        toClose.map( function( document, i )
        {
            console.log( i + " will close " + document.fileName );
            vscode.window.showTextDocument( document.fileName );
            vscode.commands.executeCommand( "workbench.action.closeActiveEditor" );
        } );


        // var tracker = vscode.window.onDidChangeActiveTextEditor( function()
        // {
        //     function next( editor )
        //     {
        //         console.log( "ap:" + activePath );
        //         console.log( "up:" + editor.document.uri.path );
        //         if( editor.document.uri.path != activePath )
        //         {
        //             console.log( "next " );
        //             clearTimeout( aborter );
        //             aborter = setTimeout( abort, 3000 );
        //             vscode.commands.executeCommand( "workbench.action.nextEditor" );
        //         }
        //         else
        //         {
        //             console.log( "Stopping" );
        //             clearTimeout( aborter );
        //             tracker.dispose();
        //         }
        //     }

        //     var editor = vscode.window.activeTextEditor;

        //     // if( editor )
        //     // {
        //     //     if( editor.document.isDirty === false )
        //     //     {
        //     //         var filepath = vscode.Uri.parse( editor.document.uri.path ).fsPath;
        //     //         var folder = path.dirname( filepath );
        //     //         var name = path.basename( filepath );

        //     //         try
        //     //         {
        //     //             var status = exec( 'git status -z ' + name, { cwd: folder } )

        //     //             if( status === undefined || ( status + "" ).trim() === "" )
        //     //             {
        //     //                 vscode.commands.executeCommand( "workbench.action.closeActiveEditor" );
        //     //             }
        //     //         }
        //     //         catch( e )
        //     //         {
        //     //         }
        //     //         next( editor );
        //     //     }
        //     //     else
        //     //     {
        //     //         next( editor );
        //     //     }
        //     // }
        // } );

        // var aborter = setTimeout( abort, 3000 );
        // vscode.commands.executeCommand( "workbench.action.nextEditor" );
    } );

    context.subscriptions.push( disposable );
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate()
{
}
exports.deactivate = deactivate;