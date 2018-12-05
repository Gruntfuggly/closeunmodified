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
            if( openEditorsTracker )
            {
                openEditorsTracker.dispose();
            }
        }

        var openEditorsTracker = vscode.window.onDidChangeActiveTextEditor( function()
        {
            function next( editor )
            {
                if( editor === undefined || editor.document.uri.path != activePath )
                {
                    clearTimeout( aborter );
                    aborter = setTimeout( abort, 1000 );
                    vscode.commands.executeCommand( "workbench.action.nextEditor" );
                }
                else
                {
                    clearTimeout( aborter );
                    openEditorsTracker.dispose();

                    if( openEditors.length > 0 )
                    {
                        vscode.workspace.saveAll( true ).then( function()
                        {
                            var keepEditors = openEditors.filter( function( editor )
                            {
                                var keep = editor.isDirty === true;

                                if( keep === false )
                                {
                                    var folder = path.dirname( editor.fileName );
                                    var name = path.basename( editor.fileName );
                                    try
                                    {
                                        var status = exec( 'git status -z ' + name, { cwd: folder } )

                                        if( status && ( status + "" ).trim() !== "" )
                                        {
                                            keep = true;
                                        }
                                    }
                                    catch( e )
                                    {
                                    }
                                }
                                return keep;
                            } );

                            vscode.commands.executeCommand( "workbench.action.closeAllEditors" ).then( function()
                            {
                                keepEditors.map( function( editor )
                                {
                                    vscode.workspace.openTextDocument( editor.fileName ).then( function( document )
                                    {
                                        vscode.window.showTextDocument( document, { preview: false } );
                                    } );
                                } );
                            } );
                        } );
                    }
                }
            }

            if( activePath === undefined )
            {
                activePath = vscode.window.activeTextEditor.document.uri.path;
            }

            var editor = vscode.window.activeTextEditor;
            if( editor && editor.document && editor.document.uri.scheme === 'file' )
            {
                openEditors.push( { fileName: editor.document.fileName, isDirty: editor.document.isDirty } );
            }

            next( editor );
        } );

        var activePath;

        if( vscode.window.activeTextEditor )
        {
            activePath = vscode.window.activeTextEditor.document.uri.path;
        }

        var openEditors = [];

        var aborter = setTimeout( abort, 1000 );
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