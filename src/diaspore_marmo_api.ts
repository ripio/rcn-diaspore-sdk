import {
    RequestParams,
    LendParams,
    PayParams,
    WithdrawParams,
    WithdrawPartialParams,
    ApproveRequestParams,
    DiasporeWeb3CostructorParams,
    GetBalanceParams,
    RequestMarmoCallBackParams
} from './diaspore_api'
import { EventMarmoCallback } from './types';
import { ContractEventArg } from 'ethereum-types';
import { BigNumber, addressUtils } from '@0x/utils';
import LoanManagerMarmoWrapper from './contract_wrappers/components/marmo/loan_manager_wrapper';
import { Wallet, Provider, SignedIntent, Intent, IntentAction, IntentBuilder, WETH } from 'marmojs';
import assert from './utils/assert';
import { DiasporeAbstractAPI } from './diaspore_abstract_api';
import { StatusCode } from 'marmojs';

/**
 * @param provider The Marmo3 provider
 * @param wallet The wallet for sign
 */
export interface DiasporeMarmoCostructorParams extends DiasporeWeb3CostructorParams {
    subProvider: Provider;
    wallet: Wallet;
}

const setWait = (ms: any) => new Promise((r, j) => setTimeout(r, ms))

export class DiasporeMarmoAPI extends DiasporeAbstractAPI {

    subProvider: Provider;
    wallet: Wallet;
    /**
    * An instance of the LoanManagerWrapper class containing methods
   * for interacting with diaspore smart contract.
   */
    public loanManagerMarmoWrapper: LoanManagerMarmoWrapper;

    /**
      * Instantiates a new DiasporeMarmoAPI instance.
      * @return  An instance of the DiasporeMarmoCostructorParams class.
      */
    public constructor(params: DiasporeMarmoCostructorParams) {
        super(params)
        if (params.diasporeRegistryAddress !== undefined) {
            assert.isETHAddressHex('diasporeRegistryAddress', params.diasporeRegistryAddress);
        }

        this.loanManagerMarmoWrapper = new LoanManagerMarmoWrapper(
            this.loanManagerWrapper,
            this.contractFactory.getLoanManagerContractAddress(),
            params.wallet,
            params.subProvider
        );

        this.subProvider = params.subProvider;
        this.wallet = params.wallet;

    }

    // TODO: remove freezing, execute async callback
    public wait = async (predicate: () => Promise<boolean>, intentId: string, callback: EventMarmoCallback, timeout: number = 30, period = 1000) => {
        const mustEnd = Date.now() + timeout * period;
        while (Date.now() < mustEnd) {
            if (await predicate()) {
                //TODO: sent to receipt (add Status Object to marmojs)
                callback(null, (await this.getStatus(intentId)).toString())
                return true
            } else {
                await setWait(period)
            }
        }
        return false;
    }

    public request = async (params: RequestMarmoCallBackParams): Promise<string> => {
        const request = await this.createRequestLoanParam(params);
        const intentId: string = await this.loanManagerMarmoWrapper.requestLoan(request);

        if (params.callback) {
            this.wait(async () => (await this.getStatus(intentId) === StatusCode.Settling), intentId, params.callback, 640)
        }

        return Promise.resolve<string>(intentId);
    }

    public lend = async (params: LendParams) => {
        const request = await this.createLendRequestParam(params);
        const intentId: string = await this.loanManagerMarmoWrapper.lend(request);
        return Promise.resolve<string>(intentId);
    }

    public pay = async (params: PayParams) => {
        //TODO: MAKE
    }

    public payToken = async (params: PayParams) => {
        //TODO: MAKE
    }

    public withdraw = async (params: WithdrawParams) => {
        const intentId = this.debtEngineModelWrapper.withdraw(params.id, params.to);
        return intentId;
    }

    public withdrawPartial = async (params: WithdrawPartialParams) => {
        const intentId = await this.debtEngineModelWrapper.withdrawPartial(params.id, params.to, params.amount);
        return intentId;

    }

    public approveRequest = async (params: ApproveRequestParams) => {
        const intentId = await this.loanManagerWrapper.approveRequest(params.id);
        return intentId;
    }

    /**
     * Get the account currently used by DiasporeMarmoAPI
     * @return Address string
     */
    public getAccount = async (): Promise<string> => {
        return Promise.resolve<string>(this.wallet.address);
    };

    /**
     * Get the ETH balance
     * @return Balance BigNumber
     */
    public getBalance = async (params: GetBalanceParams): Promise<BigNumber> => {
        const addr = params.address !== undefined ? params.address : await this.getAccount();
        assert.isETHAddressHex('address', addr);
        return this.web3Wrapper.getBalanceInWeiAsync(addr);
    };

    public getStatus = async (intentId: string): Promise<StatusCode> => {
        // FIXME: (WA)
        // there are that accept empty intent actions on marmojs
        const intentActionMock = new WETH(addressUtils.generatePseudoRandomAddress()).approve(addressUtils.generatePseudoRandomAddress(), "0");
        const intent: Intent = new IntentBuilder().withIntentAction(intentActionMock).build();
        const signedIntent = this.wallet.sign(intent);
        signedIntent.id = intentId; // Work araund
        return (await signedIntent.status(this.subProvider)).code;
    }

}
