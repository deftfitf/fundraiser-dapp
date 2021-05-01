import React, { useState, useEffect } from "react";
import FundraiserFactoryContract from "./contracts/FundraiserFactory.json";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import FundraiserCard from "./FundraiserCard";

const Home = () => {
    const [ contract, setContract ] = useState(null);
    const [ accounts, setAccounts ] = useState(null);
    const [ funds, setFunds ] = useState([]);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        try {
            const provider = await detectEthereumProvider();
            const web3 = new Web3(provider);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = FundraiserFactoryContract.networks[networkId];
            const accounts = await web3.eth.getAccounts();
            const instance = new web3.eth.Contract(
                FundraiserFactoryContract.abi,
                deployedNetwork && deployedNetwork.address
            );
            setContract(instance);
            setAccounts(accounts);

            const funds = await instance.methods.fundraisers(10, 0).call();
            setFunds(funds);
        } catch (error) {
            alert(
                `Failed to load web3, accounts, or contract. Check console for details`,
            );
            console.error(error);
        }
    }

    const displayFundraisers = () => {
        return funds.map((fundraiser) => {
            return (
                <FundraiserCard fundraiser={fundraiser} />
            );
        });
    }

    return (
        <div className="main-container">
            {displayFundraisers()}
        </div>
    )
}

export default Home;