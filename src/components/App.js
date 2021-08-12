import React, { Component } from "react";
import { HashRouter, Route } from "react-router-dom";
import "./App.css";
import Web3 from "web3";

import CryptoPunks from "../abis/CryptoPunks.json";
import CryptoPunksMarket from "../abis/CryptoPunksMarket.json";

import FormAndPreview from "../components/FormAndPreview/FormAndPreview";
import AccountDetails from "./AccountDetails/AccountDetails";
import ContractNotDeployed from "./ContractNotDeployed/ContractNotDeployed";
import ConnectToMetamask from "./ConnectMetamask/ConnectToMetamask";
import Loading from "./Loading/Loading";
import Navbar from "./Navbar/Navbar";
import MyCryptoBoys from "./MyCryptoBoys/MyCryptoBoys";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accountAddress: "",
      accountBalance: "",
      cryptoBoysContract: null,
      cryptoBoysMarketContract: null,
      cryptoBoysCount: 0,    
      cryptoBoys: [],
      loading: true,
      metamaskConnected: false,
      contractDetected: false,
      totalTokensMinted: 0,
      totalTokensOwnedByAccount: 0,
      nameIsUsed: false,
      colorIsUsed: false,
      colorsUsed: [],
      lastMintTime: null,
    };
  }

  componentWillMount = async () => {
    await this.loadWeb3();
    await this.loadBlockchainData();
  };

  setMintBtnTimer = () => {
    const mintBtn = document.getElementById("mintBtn");
    if (mintBtn !== undefined && mintBtn !== null) {
      this.setState({
        lastMintTime: localStorage.getItem(this.state.accountAddress),
      });
      this.state.lastMintTime === undefined || this.state.lastMintTime === null
        ? (mintBtn.innerHTML = "Mint My Crypto Boy")
        : this.checkIfCanMint(parseInt(this.state.lastMintTime));
    }
  };

  checkIfCanMint = (lastMintTime) => {
    const mintBtn = document.getElementById("mintBtn");
    const timeGap = 300000; //5min in milliseconds
    const countDownTime = lastMintTime + timeGap;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = countDownTime - now;
      if (diff < 0) {
        mintBtn.removeAttribute("disabled");
        mintBtn.innerHTML = "Mint My Crypto Boy";
        localStorage.removeItem(this.state.accountAddress);
        clearInterval(interval);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        mintBtn.setAttribute("disabled", true);
        mintBtn.innerHTML = `Next mint in ${minutes}m ${seconds}s`;
      }
    }, 1000);
  };

  loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  };

  loadBlockchainData = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      this.setState({ metamaskConnected: false });
    } else {
      this.setState({ metamaskConnected: true });
      this.setState({ loading: true });
      this.setState({ accountAddress: accounts[0] });
      let accountBalance = await web3.eth.getBalance(accounts[0]);
      accountBalance = web3.utils.fromWei(accountBalance, "Ether");
      this.setState({ accountBalance });
      this.setState({ loading: false });
      const networkId = await web3.eth.net.getId();
      const networkData = CryptoPunks.networks[networkId];
      if (networkData) {
        this.setState({ loading: true });
        const cryptoBoysContract = web3.eth.Contract(
          CryptoPunks.abi,
          networkData.address
        );
	const cryptoBoysMarketContract = web3.eth.Contract(
          CryptoPunksMarket.abi,
          networkData.address
        );
      
        this.setState({ cryptoBoysContract });
        this.setState({ cryptoBoysMarketContract });
	this.setState({ contractDetected: true });
        const cryptoBoysCount = await cryptoBoysContract.methods
          .totalSupply()
          .call();
        this.setState({ cryptoBoysCount });
	this.setState({ loading: false });
      } else {
        this.setState({ contractDetected: false });
      }
    }
  };	  

  connectToMetamask = async () => {
    await window.ethereum.enable();
    this.setState({ metamaskConnected: true });
    window.location.reload();
  };

mintMyNFT = async (punkIndex, punkPrice) => {
  this.setState({ loading: true });
    this.state.cryptoBoysMarketContract.methods
      .offerPunkForSale(punkIndex, punkPrice)
      .send({ from: this.state.accountAddress })
      .on("confirmation", () => {
        localStorage.setItem(this.state.accountAddress, new Date().getTime());
        this.setState({ loading: false });
        window.location.reload();
      });
};
offerPunkForSale = async (punkIndex, punkPrice) => {
  this.setState({ loading: true });
    this.state.cryptoBoysMarketContract.methods
      .offerPunkForSale(punkIndex, punkPrice)
      .send({ from: this.state.accountAddress })
      .on("confirmation", () => {
        localStorage.setItem(this.state.accountAddress, new Date().getTime());
        this.setState({ loading: false });
        window.location.reload();
      });
};
claimPunk = async (punkIndex) => {
  this.setState({ loading: true });
    this.state.cryptoBoysMarketContract.methods
      .getPunk(punkIndex)
      .send({ from: this.state.accountAddress})
      .on("confirmation", () => {
        localStorage.setItem(this.state.accountAddress, new Date().getTime());
        this.setState({ loading: false });
        window.location.reload();
      });
};
buyPunk = async (punkIndex, punkPrice) => {
  this.setState({ loading: true });
    this.state.cryptoBoysMarketContract.methods
      .buyPunk(punkIndex)
      .send({ from: this.state.accountAddress, value: punkPrice })
      .on("confirmation", () => {
        localStorage.setItem(this.state.accountAddress, new Date().getTime());
        this.setState({ loading: false });
        window.location.reload();
      });
};
  render() {
    return (
      <div className="container">
        {!this.state.metamaskConnected ? (
          <ConnectToMetamask connectToMetamask={this.connectToMetamask} />
        ) : !this.state.contractDetected ? (
          <ContractNotDeployed />
        ) : this.state.loading ? (
          <Loading />
        ) : (
          <>
            <HashRouter basename="/">
              <Navbar />
              <Route
                path="/"
                exact
                render={() => (
                  <AccountDetails
                    accountAddress={this.state.accountAddress}
                    accountBalance={this.state.accountBalance}
                  />
                )}
              />
              <Route
                path="/mint"
                render={() => (
                  <FormAndPreview
                    mintMyNFT={this.mintMyNFT}
                    buyPunk={this.buyPunk}
                    offerPunkForSale={this.offerPunkForSale}
		    claimPunk={this.claimPunk}
		    nameIsUsed={this.state.nameIsUsed}
                    colorIsUsed={this.state.colorIsUsed}
                    colorsUsed={this.state.colorsUsed}
                    setMintBtnTimer={this.setMintBtnTimer}
                  />
                )}
              />
              <Route
                path="/my-tokens"
                render={() => (
                  <MyCryptoBoys
                    accountAddress={this.state.accountAddress}
                    cryptoBoys={this.state.cryptoBoys}
                    totalTokensOwnedByAccount={
                      this.state.totalTokensOwnedByAccount
                    }
                  />
                )}
              />		
		</HashRouter>
	  </>
        )}
      </div>
    );
  }
}

export default App;