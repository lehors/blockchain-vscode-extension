/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

import * as vscode from 'vscode';
import * as myExtension from '../../src/extension';
import { FabricGatewayRegistry } from '../../src/fabric/FabricGatewayRegistry';
import { FabricRuntimeRegistry } from '../../src/fabric/FabricRuntimeRegistry';
import { FabricRuntimeManager } from '../../src/fabric/FabricRuntimeManager';
import { ExtensionUtil } from '../../src/util/ExtensionUtil';
import { FabricRuntime } from '../../src/fabric/FabricRuntime';
import { VSCodeOutputAdapter } from '../../src/logging/VSCodeOutputAdapter';
import { BlockchainNetworkExplorerProvider } from '../../src/explorer/BlockchainNetworkExplorer';
import { BlockchainTreeItem } from '../../src/explorer/model/BlockchainTreeItem';
import { RuntimeTreeItem } from '../../src/explorer/runtimeOps/RuntimeTreeItem';
import { UserInputUtil } from '../../src/commands/UserInputUtil';
import { TestUtil } from '../TestUtil';

import * as chai from 'chai';
import * as sinon from 'sinon';
import { ExtensionCommands } from '../../ExtensionCommands';
chai.should();

// tslint:disable no-unused-expression
describe('teardownFabricRuntime', () => {

    let sandbox: sinon.SinonSandbox;
    const connectionRegistry: FabricGatewayRegistry = FabricGatewayRegistry.instance();
    const runtimeRegistry: FabricRuntimeRegistry = FabricRuntimeRegistry.instance();
    const runtimeManager: FabricRuntimeManager = FabricRuntimeManager.instance();
    let runtime: FabricRuntime;
    let runtimeTreeItem: RuntimeTreeItem;

    before(async () => {
        await TestUtil.setupTests();
        await TestUtil.storeGatewaysConfig();
        await TestUtil.storeRuntimesConfig();
    });

    after(async () => {
        await TestUtil.restoreGatewaysConfig();
        await TestUtil.restoreRuntimesConfig();
    });

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        await ExtensionUtil.activateExtension();
        await connectionRegistry.clear();
        await runtimeRegistry.clear();
        await runtimeManager.clear();
        await runtimeManager.add('local_fabric');
        runtime = runtimeManager.get('local_fabric');
        const provider: BlockchainNetworkExplorerProvider = myExtension.getBlockchainNetworkExplorerProvider();
        const children: BlockchainTreeItem[] = await provider.getChildren();
        runtimeTreeItem = children.find((child: BlockchainTreeItem) => child instanceof RuntimeTreeItem) as RuntimeTreeItem;
    });

    afterEach(async () => {
        sandbox.restore();
        await connectionRegistry.clear();
        await runtimeRegistry.clear();
        await runtimeManager.clear();
    });

    it('should teardown a Fabric runtime', async () => {
        const warningStub: sinon.SinonStub = sandbox.stub(UserInputUtil, 'showConfirmationWarningMessage').resolves(true);
        const teardownStub: sinon.SinonStub = sandbox.stub(runtime, 'teardown').resolves();
        await vscode.commands.executeCommand(ExtensionCommands.TEARDOWN_FABRIC);
        warningStub.should.have.been.calledOnce;
        teardownStub.should.have.been.called.calledOnceWithExactly(VSCodeOutputAdapter.instance());
    });

    it('should handle cancel from confirmation message', async () => {
        const warningStub: sinon.SinonStub = sandbox.stub(UserInputUtil, 'showConfirmationWarningMessage').resolves(false);
        const teardownStub: sinon.SinonStub = sandbox.stub(runtime, 'teardown').resolves();
        await vscode.commands.executeCommand(ExtensionCommands.TEARDOWN_FABRIC, runtimeTreeItem);
        warningStub.should.have.been.calledOnce;
        teardownStub.should.not.have.been.called;
    });

});
