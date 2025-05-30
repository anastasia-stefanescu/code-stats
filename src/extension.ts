//const vscode from 'vscode');
import { createCommands } from './command_creator';
import { window, Uri, ExtensionContext, commands, workspace, authentication} from 'vscode';

import { getServerRunning } from './server';
import { MyAuth0AuthProvider } from './Authentication/auth_provider';
import { CurrentSessionVariables } from './EventTracking/event_management';
import { GitTracking } from './Git/local_git_tracking';
import { testGitApi } from './testScripts/test_git_api';
import { testSqliteDatabase } from './Database/test_db';
import { NodeCacheManager } from './Cache';

export let instance: CurrentSessionVariables;
export let gitInstance: GitTracking | undefined = undefined;
export let cacheInstance: NodeCacheManager;
export let authProvider: MyAuth0AuthProvider | undefined = undefined;

// activate runs for every workspace / project / window
export async function activate (context: ExtensionContext)
{
  console.log('CodeStats: Activating extension...');

  authProvider = new MyAuth0AuthProvider(context);

  context.subscriptions.push(createCommands(context, authProvider));

  getServerRunning();

  // if user doesn't log in, create an anonymous session??

  instance = CurrentSessionVariables.getInstance();

  cacheInstance = NodeCacheManager.getInstance();

  gitInstance = await GitTracking.getInstance();

  testSqliteDatabase();

  // // it seems this actually triggers the authentication flow
  // const session = await authentication.getSession('auth0-auth-provider', [], { createIfNone: true });
  // console.log('Auth0 token', session.accessToken);
  // console.log('Auth0 account', session.account.id, session.account.label);
  // console.log('Auth0 id', session.id);
}


// hook onto this so we can send all data from cache to cloud
export function deactivate() {
  console.log('CodeStats: Deactivating extension...');
  window.showInformationMessage('CodeStats: Deactivating extension...');

  // emitToCacheProjectData(true); // send all data to cache
  // emitFromCacheProjectChangeData(); // send all data to cloud
};

export async function reload() {
  console.log("RELOAD!!!")
  window.showInformationMessage('CodeStats: Reloading extension...');
// DO WE HAVE TO DO SOMETHING WITH THE AUTH0 SESSION HERE?

  // updateFlowModeStatus();

  // try {
  //   initializeWebsockets();
  // } catch (e: any) {
  //   logIt(`Failed to initialize websockets: ${e.message}`);
  // }

  // // re-initialize user and preferences
  // await getUser();

  // // fetch after logging on
  // SummaryManager.getInstance().updateSessionSummaryFromServer();

  // if (musicTimeExtInstalled()) {
  //   setTimeout(() => {
  //     commands.executeCommand("musictime.refreshMusicTimeView")
  //   }, 1000);
  // }

  // if (editorOpsExtInstalled()) {
  //   setTimeout(() => {
  //     commands.executeCommand("editorOps.refreshEditorOpsView")
  //   }, 1000);
  // }

  //commands.executeCommand('codetime.refreshCodeTimeView');
}

// make Auth0AuthProvider a singleton
