pragma solidity >=0.4.23 <0.7.0;

import "./Fundraiser.sol";

contract FundraiserFactory {
    Fundraiser[] private _fundraisers;
    uint256 constant maxLimit = 20;

    event FundraiserCreated(Fundraiser indexed fundraiser, address indexed owner);

    function fundraisersCount() public view returns(uint256) {
        return _fundraisers.length;
    }

    function createFundraiser(
        string memory name,
        string memory url,
        string memory imageURL,
        string memory description,
        address payable beneficiary
    ) public {
        Fundraiser fundraiser = new Fundraiser(
            name,
            url,
            imageURL,
            description,
            beneficiary,
            msg.sender
        );
        _fundraisers.push(fundraiser);
        emit FundraiserCreated(fundraiser, fundraiser.owner());
    }

    function fundraisers(uint256 limit, uint256 offset) public view returns(Fundraiser[] memory fundraisers) {
        require(offset <= fundraisersCount(), "offset out of bounds");

        uint256 size = min(maxLimit, min(fundraisersCount() - offset, limit));
        fundraisers = new Fundraiser[](size);

        for (uint256 i = 0; i < size; i++) {
            fundraisers[i] = _fundraisers[i + offset];
        }

        return fundraisers;
    }

    function min(uint256 a, uint256 b) private pure returns(uint256) {
        return a < b ? a : b;
    }

}