// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require( 'vscode' ),
    path = require( 'path' ),
    exec = require( 'child_process' ).execSync;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate( context )
{
    var outputChannel;

    function debug( text )
    {
        if( outputChannel === undefined )
        {
            outputChannel = vscode.window.createOutputChannel( "Close Unmodified" );
        }

        outputChannel.appendLine( new Date().toISOString() + ": " + text );
    }

    var disposable = vscode.commands.registerCommand( 'extension.closeUnmodifiedEditors', function()
    {
        function abort()
        {
            debug( "abort" );
            if( openEditorsTracker )
            {
                openEditorsTracker.dispose();
            }
        }

        var openEditorsTracker = vscode.window.onDidChangeActiveTextEditor( function()
        {
            debug( "editor changed" );

            function next( editor )
            {
                if( editor === undefined || editor.document.uri.path != activePath )
                {
                    debug( "can't do anything with this editor - trying next..." );
                    clearTimeout( aborter );
                    aborter = setTimeout( abort, 1000 );
                    vscode.commands.executeCommand( "workbench.action.nextEditor" );
                }
                else
                {
                    debug( "resetting aborter" );
                    clearTimeout( aborter );
                    openEditorsTracker.dispose();

                    debug( "openEditors:" + openEditors.length );
                    if( openEditors.length > 0 )
                    {
                        debug( "Saving editors..." );
                        vscode.workspace.saveAll( true ).then( function()
                        {
                            var keepEditors = openEditors.filter( function( editor )
                            {
                                debug( " Checking " + editor.fileName + "..." );
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
                                debug( "   Keep: " + ( keep ? "yes" : "no" ) );
                                return keep;
                            } );

                            debug( "Closing Editors..." );

                            vscode.commands.executeCommand( "workbench.action.closeAllEditors" ).then( function()
                            {
                                debug( " Reopening editors..." );
                                keepEditors.map( function( editor )
                                {
                                    debug( "  Opening:" + editor.fileName );
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
                debug( "setting current editor" );
                activePath = vscode.window.activeTextEditor.document.uri.path;
            }

            var editor = vscode.window.activeTextEditor;
            if( editor && editor.document && editor.document.uri.scheme === 'file' )
            {
                debug( "adding editor: " + editor.document.fileName );
                openEditors.push( { fileName: editor.document.fileName, isDirty: editor.document.isDirty } );
            } else
            {
                debug( "ignoring editor" );
            }

            debug( "next editor" );
            next( editor );
        } );

        var activePath;

        if( vscode.window.activeTextEditor )
        {
            activePath = vscode.window.activeTextEditor.document.uri.path;
        }

        var openEditors = [];

        debug( "Starting..." );
        var aborter = setTimeout( abort, 1000 );
        vscode.commands.executeCommand( "workbench.action.nextEditor" );
    } );

    debug( "Ready" );

    context.subscriptions.push( disposable );
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate()
{
}
exports.deactivate = deactivate;