/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as path from 'path';
import { MongoClient, Db } from 'mongodb';
import { IAzureParentTreeItem, IAzureTreeItem, IAzureNode, UserCancelledError } from 'vscode-azureextensionui';
import { MongoDatabaseTreeItem } from '../nodes';

export class MongoAccountTreeItem implements IAzureParentTreeItem {
    public static contextValue: string = "cosmosDBMongoServer";
    public readonly contextValue: string
    public readonly childTypeLabel: string = "Database";
    public readonly id: string;
    public readonly label: string;

    public readonly connectionString: string;

    constructor(id: string, label: string, connectionString: string, contextValue: string = MongoAccountTreeItem.contextValue) {
        this.id = id;
        this.label = label;
        this.connectionString = connectionString;
        this.contextValue = contextValue;
    }

    public get iconPath(): any {
        return {
            light: path.join(__filename, '..', '..', '..', '..', '..', 'resources', 'icons', 'light', 'CosmosDBAccount.svg'),
            dark: path.join(__filename, '..', '..', '..', '..', '..', 'resources', 'icons', 'dark', 'CosmosDBAccount.svg')
        };
    }

    public hasMoreChildren(): boolean {
        return false;
    }

    public async loadMoreChildren(_node: IAzureNode, _clearCache: boolean): Promise<IAzureTreeItem[]> {
        let db: Db | undefined;
        try {
            db = await MongoClient.connect(this.connectionString);
            const result: { databases: { name }[] } = await db.admin().listDatabases();
            return result.databases.map(database => new MongoDatabaseTreeItem(database.name, this.connectionString, this.id));
        } catch (error) {
            return [{
                id: 'cosmosMongoError',
                contextValue: 'cosmosMongoError',
                label: error.message,
            }];
        } finally {
            if (db) {
                db.close();
            }
        }
    }

    public async createChild(_node: IAzureNode, showCreatingNode: (label: string) => void): Promise<IAzureTreeItem> {
        const databaseName = await vscode.window.showInputBox({
            placeHolder: "Database Name",
            prompt: "Enter the name of the database"
        });
        if (databaseName) {
            const collectionName = await vscode.window.showInputBox({
                placeHolder: 'Collection Name',
                prompt: 'A collection is required to create a database',
                ignoreFocusOut: true
            });
            if (collectionName) {
                showCreatingNode(databaseName);

                const databaseTreeItem = new MongoDatabaseTreeItem(databaseName, this.connectionString, this.id);
                await databaseTreeItem.createCollection(collectionName);
                return databaseTreeItem;
            }
        }

        throw new UserCancelledError();
    }
}
