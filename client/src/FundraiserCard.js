import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";

import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FilledInput from "@material-ui/core/FilledInput";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import OutlinedInput from "@material-ui/core/OutlinedInput";
import { Link } from "react-router-dom";

import FundraiserContract from "./contracts/Fundraiser.json";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";

const cc = require("cryptocompare");

const useStyles = makeStyles(theme => ({
    card: {
        minWidth: 450,
        height: 400,
    },
    media: {
        height: 140,
    },
    button: {
        margin: theme.spacing(1),
    },
    input: {
        display: "none"
    },
    container: {
        display: "flex",
        flexWrap: "wrap",
    },
    formControl: {
        margin: theme.spacing(1),
        display: "table-cell",
    },
    paper: {
        position: "absolute",
        width: 400,
        backgroudColor: theme.palette.background.paper,
        border: "none",
        boxShadow: "none",
        padding: 4
    },
}));

const FundraiserCard = (props) => {
    const classes = useStyles();

    const [web3, setWeb] = useState(null);
    const [contract, setContract] = useState(null);
    const [accounts, setAccounts] = useState(null);
    const [fundName, setFundName] = useState(null);
    const [description, setDescription] = useState(null);
    const [totalDonations, setTotalDonations] = useState(null);
    const [donationCount, setDonationCount] = useState(null);
    const [imageURL, setImageURL] = useState(null);
    const [url, setUrl] = useState(null);
    const [beneficiary, setNewBeneficiary] = useState(null);

    const [open, setOpen] = useState(false);

    const [donationAmount, setDonationAmount] = useState(null);
    const [exchangeRate, setExchangeRate] = useState(null);
    const ethAmount = (donationAmount / exchangeRate || 0).toFixed(4);

    const [userDonations, setUserDonations] = useState(null);
    const [ isOwner, setIsOwner ] = useState(false);

    const {fundraiser} = props;

    useEffect(() => {
        if (fundraiser) {
            init(fundraiser);
            window.ethereum.on(
                "accountsChanged",
                accounts => window.location.reload()
            );
        }
    }, [fundraiser]);

    const init = async (fundraiser) => {
        try {
            const fund = fundraiser;
            const provider = await detectEthereumProvider();
            const web3 = new Web3(provider);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = FundraiserContract.networks[networkId];
            const accounts = await web3.eth.getAccounts();
            const instance = new web3.eth.Contract(
                FundraiserContract.abi, fund
            );
            setWeb(web3);
            setContract(instance);
            setAccounts(accounts);

            const name = await instance.methods.name().call();
            const description = await instance.methods.description().call();
            const totalDonations = await instance.methods.totalDonations().call();
            const imageURL = await instance.methods.imageURL().call();
            const url = await instance.methods.url().call();

            const exchangeRate = await cc.price("ETH", ["USD"]);
            setExchangeRate(exchangeRate.USD);
            const eth = web3.utils.fromWei(totalDonations, "ether");
            const dollarDonationAmount = exchangeRate.USD * eth;

            setFundName(name);
            setDescription(description);
            setTotalDonations(dollarDonationAmount.toFixed(2));
            setImageURL(imageURL);
            setUrl(url);

            const userDonations =
                await instance.methods.myDonations().call({from: accounts[0]});
            setUserDonations(userDonations);

            const isUser = accounts[0];
            const isOwner = await instance.methods.owner().call();
            if (isOwner === accounts[0]) {
                setIsOwner(true);
            }
        } catch (error) {
            alert(
                `Failed to load web3, accounts, or contract, Check console for details`,
            );
            console.error(error);
        }
    }

    const handleOpen = () => {
        setOpen(true);
    }

    const handleClose = () => {
        setOpen(false);
    }

    const submitFunds = async () => {
        const ethTotal = donationAmount / exchangeRate;
        const donation = web3.utils.toWei(ethTotal.toString());

        await contract.methods.donate().send({
            from: accounts[0],
            value: donation,
            gas: 650000,
        });
        setOpen(false);
    }

    const renderDonationsList = () => {
        let donations = userDonations;
        if (donations === null) {
            return null;
        }

        const totalDonations = donations.values.length;
        let donationList = [];
        let i;
        for (i = 0; i < totalDonations; i++) {
            const ethAmount = web3.utils.fromWei(donations.values[i]);
            const userDonation = exchangeRate * ethAmount;
            const donationDate = donations.dates[i];
            donationList.push({
                donationAmount: userDonation.toFixed(2),
                date: donationDate
            });
        }
        return donationList.map((donation) => {
            return (
                <div className="donation-list">
                    <p>${donation.donationAmount}</p>
                    <Button variant="contained" color="primary">
                        <Link className="donation-receipt-link"
                              to={{
                                  pathname: "/receipts",
                                  state: {
                                      fund: fundName,
                                      donation: donation.donationAmount,
                                      date: donation.date
                                  }
                              }}>
                            Request Receipt
                        </Link>
                    </Button>
                </div>
            );
        });
    }

    const withdrawalFunds = async () => {
        await contract.methods.withdraw().send({
            from: accounts[0],
        });
        alert("Funds Withdrawn!");
        setOpen(false);
    };

    const setBeneficiary = async () => {
        await contract.methods.setBeneficiary(beneficiary).send({
            from: accounts[0],
        });
        alert(`Fundraiser Beneficiary Changed`);
        setOpen(false);
    };

    return (
        <div className="fundraiser-card-content">
            <Dialog open={open} onClose={handleClose}
                    area-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Donate to</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        <img src={imageURL} width="200px" height="130px"/>
                        <p>{description}</p>
                        <div className="donation-input-container">
                            <FormControl className={classes.formControl}>
                                $
                                <Input id="component-simple"
                                       value={donationAmount}
                                       onChange={(e) => setDonationAmount(e.target.value)}
                                       placeholder="0.00"/>
                            </FormControl>
                            <p>Eth: {ethAmount}</p>
                        </div>
                        <Button onClick={submitFunds} variant="contained" color="primary">
                            Donate
                        </Button>
                        <div>
                            <h3>My donations</h3>
                            {renderDonationsList()}
                        </div>

                        { isOwner &&
                        <div>
                            <FormControl className={classes.formControl}>
                                Beneficiary:
                                <Input value={beneficiary}
                                       onChange={(e) => setNewBeneficiary(e.target.value)}
                                       placeholder="Set Beneficiary" />
                            </FormControl>

                            <Button variant="contained"
                                    style={{ marginTop: 20 }}
                                    color="primary"
                                    onClick={setBeneficiary}>
                                Set Beneficiary
                            </Button>
                        </div>
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    { isOwner &&
                        <Button variant="contained" color="primary" onClick={withdrawalFunds}>
                            Withdrawal
                        </Button>
                    }
                </DialogActions>
            </Dialog>
            <Card className={classes.card} onClick={handleOpen}>
                <CardActionArea>
                    <CardMedia className={classes.media}
                               image={imageURL}
                               title="Fundraiser Image"/>
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="h2">
                            {fundName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" component="p">
                            <p>{description}</p>
                            <p>Total Donations: ${totalDonations}</p>
                        </Typography>
                    </CardContent>
                </CardActionArea>
                <CardActions>
                    <Button onClick={handleOpen}
                            variant="contained"
                            className={classes.button}>
                        View More
                    </Button>
                </CardActions>
            </Card>
        </div>
    );
}

export default FundraiserCard;