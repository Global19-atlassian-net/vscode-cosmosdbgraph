/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// tslint:disable:no-implicit-dependencies (this allows the use of dev dependencies)

import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as path from 'path';
import { Stream } from "stream";
import { gulp_installAzureAccount, gulp_installVSCodeExtension, gulp_webpack } from 'vscode-azureextensiondev';

async function prepareForWebpack(): Promise<void> {
    const mainJsPath: string = path.join(__dirname, 'main.js');
    let contents: string = (await fse.readFile(mainJsPath)).toString();
    contents = contents
        .replace('out/src/extension', 'dist/extension.bundle')
        .replace(', true /* ignoreBundle */', '');
    await fse.writeFile(mainJsPath, contents);
}

function gulp_installCosmosDBExtension(): Promise<void> | Stream {
    return gulp_installVSCodeExtension('ms-azuretools', 'vscode-cosmosdb');
}

exports['webpack-dev'] = gulp.series(prepareForWebpack, () => gulp_webpack('development'));
exports['webpack-prod'] = gulp.series(prepareForWebpack, () => gulp_webpack('production'));
exports.preTest = gulp.series(gulp_installAzureAccount, gulp_installCosmosDBExtension);
