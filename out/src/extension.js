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
    var aborter;

    function debug( text )
    {
        if( outputChannel === undefined )
        {
            outputChannel = vscode.window.createOutputChannel( "Close Unmodified" );
        }

        outputChannel.appendLine( new Date().toISOString() + ": " + text );
    }
    context.subscriptions.push( vscode.commands.registerCommand( 'closeUnmodified.resetOpenFileCache', function()
    {
        context.workspaceState.update( 'openEditors', [] ).then( dumpOpenEditors );
    } ) );

    context.subscriptions.push( vscode.commands.registerCommand( 'closeUnmodified.closeUnmodifiedEditors', function()
    {
        var openEditors = context.workspaceState.get( 'openEditors', [] );

        debug( "Checking editors..." );

        var editorsToKeep = openEditors.filter( function( filename )
        {
            debug( " Checking " + filename + "..." );
            var keep = false;
            {
                var folder = path.dirname( filename );
                var name = path.basename( filename );
                try
                {
                    debug( "  Getting status..." );
                    var status = exec( 'git status -z ' + name, { cwd: folder } )
                    debug( "    status:" + status );
                    if( status && ( status + "" ).trim() !== "" )
                    {
                        keep = true;
                    }
                }
                catch( e )
                {
                    debug( "   " + e );
                }
            }
            debug( "   Keep: " + ( keep ? "yes" : "no" ) );
            return keep;
        } );

        debug( "Closing Editors..." );

        vscode.commands.executeCommand( "workbench.action.closeAllEditors" ).then( function()
        {
            editorsToKeep.map( function( filename )
            {
                debug( " Opening:" + filename );
                vscode.workspace.openTextDocument( filename ).then( function( document )
                {
                    vscode.window.showTextDocument( document, { preview: false } );
                } );
            } );
        } );
    } ) );

    function dumpOpenEditors()
    {
        var openEditors = context.workspaceState.get( 'openEditors', [] );
        debug( "Open editors:\n " + JSON.stringify( openEditors, null, 2 ) );
    }

    function getDocumentFilename( document )
    {
        if( document && document.uri )
        {
            if( document.uri.scheme === 'file' )
            {
                return document.fileName;
            }
        }

        return undefined;
    }

    context.subscriptions.push( vscode.workspace.onDidOpenTextDocument( function( document )
    {
        debug( "onDidOpenTextDocument: " + JSON.stringify( document.uri ) );

        var openEditors = context.workspaceState.get( 'openEditors', [] );

        var filename = getDocumentFilename( document );

        if( filename )
        {
            if( openEditors.indexOf( filename ) === -1 )
            {
                openEditors.push( filename );
            }

            context.workspaceState.update( 'openEditors', openEditors ).then( dumpOpenEditors );
        }
    } ) );

    context.subscriptions.push( vscode.workspace.onDidCloseTextDocument( function( document )
    {
        debug( "onDidCloseTextDocument: " + JSON.stringify( document.uri ) );

        var openEditors = context.workspaceState.get( 'openEditors', [] );

        var filename = getDocumentFilename( document );

        if( filename )
        {
            var openEditors = openEditors.filter( function( openEditor )
            {
                return openEditor !== filename;
            } );

            context.workspaceState.update( 'openEditors', openEditors ).then( dumpOpenEditors );
        }
    } ) );

    context.subscriptions.push( vscode.window.onDidChangeVisibleTextEditors( function( visibleEditors )
    {
        var openEditors = context.workspaceState.get( 'openEditors', [] );

        visibleEditors.map( function( editor )
        {
            var filename = getDocumentFilename( editor.document );

            if( filename )
            {
                if( openEditors.indexOf( filename ) === -1 )
                {
                    openEditors.push( filename );
                }
            }
        } );

        context.workspaceState.update( 'openEditors', openEditors ).then( dumpOpenEditors );
    } ) );

    debug( "Ready" );
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate()
{
}
exports.deactivate = deactivate;