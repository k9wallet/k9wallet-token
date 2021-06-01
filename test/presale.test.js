const K9WalletToken = artifacts.require('K9WalletToken');
const PreSale = artifacts.require('K9WalletTokenPreSale');
const truffleAssert = require('truffle-assertions');

contract('K9WalletTokenPreSale', accounts => {

  const preSaleAmount = '1400000000';
  let token;
  let preSale;

  before(async () => {
    token = await K9WalletToken.deployed();
    preSale = await PreSale.new(accounts[0], token.address);

    await token.transfer(preSale.address, web3.utils.toWei(preSaleAmount)); 
  })

  it("should contain presale amount of tokens", async () => {
    const contractBalance = await token.balanceOf(preSale.address);
    assert.equal(contractBalance.toString(), web3.utils.toWei(preSaleAmount))
  });

  it("should reject non-owner from starting", async () => {
    await truffleAssert.reverts(preSale.start({from: accounts[2] }), "Only K9 Dev Can Start")
  });

  it("should reject transaction, presale not started", async () => {
    await truffleAssert.reverts(
        web3.eth.sendTransaction({
            from: accounts[2], 
            to: preSale.address, 
            value: 10 
        }),
        "Presale not started, chill out"
    )
  });

  it("should open presale and check", async () => {
    await preSale.start();

    assert(preSale.isOpen(), true);
  });

  it("should reject transaction, min not met", async () => {
    await truffleAssert.reverts(
        web3.eth.sendTransaction({
            from: accounts[2], 
            to: preSale.address, 
            value: web3.utils.toWei('40', 'milli') 
        }),
        "Min not met"
    )
  });

  it("should reject transaction, Max amount allowed", async () => {
    await truffleAssert.reverts(
        web3.eth.sendTransaction({
            from: accounts[2], 
            to: preSale.address, 
            value: web3.utils.toWei('11') 
        }),
        "Max Tokens per wallet reached"
    )
  });

  it("should transfer 350k tokens to buyer", async () => {

    const threeK = '350000';
    

    await web3.eth.sendTransaction({
        from: accounts[2], 
        to: preSale.address, 
        value: web3.utils.toWei('50', 'milli') // 0.05 ETH the min
    });

    const account2Balance = await token.balanceOf(accounts[2]);

    assert.equal(account2Balance.toString(), web3.utils.toWei(threeK));
  });

  it("should transfer 7 million tokens to buyer 3", async () => {

    const threeMill = '7000000';
    

    await web3.eth.sendTransaction({
        from: accounts[3], 
        to: preSale.address, 
        value: web3.utils.toWei('1')
    });

    const account3Balance = await token.balanceOf(accounts[3]);

    assert.equal(account3Balance.toString(), web3.utils.toWei(threeMill));
  });

});