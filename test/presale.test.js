const K9WalletToken = artifacts.require('K9WalletToken');
const PreSale = artifacts.require('K9WalletTokenPreSale');
const truffleAssert = require('truffle-assertions');

contract('K9WalletTokenPreSale', accounts => {

  const preSaleAmount = '1000000000';
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
    await truffleAssert.reverts(preSale.start({from: accounts[2] }), "Only Dev Can Start")
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

  it("should transfer 500k tokens to buyer", async () => {

    const threeK = '500000';
    

    await web3.eth.sendTransaction({
        from: accounts[2], 
        to: preSale.address, 
        value: web3.utils.toWei('50', 'milli') // 0.05 ETH the min
    });

    const account2Balance = await token.balanceOf(accounts[2]);

    assert.equal(account2Balance.toString(), web3.utils.toWei(threeK));
  });

  it("should transfer 10 million tokens to buyer 3", async () => {

    const threeMill = '10000000';
    

    await web3.eth.sendTransaction({
        from: accounts[3], 
        to: preSale.address, 
        value: web3.utils.toWei('1')
    });

    const account3Balance = await token.balanceOf(accounts[3]);

    assert.equal(account3Balance.toString(), web3.utils.toWei(threeMill));
  });

  it("should transfer 100 million tokens to buyer 4", async () => {

    const threeMill = '100000000';
    

    await web3.eth.sendTransaction({
        from: accounts[4], 
        to: preSale.address, 
        value: web3.utils.toWei('10')
    });

    const account4Balance = await token.balanceOf(accounts[4]);

    assert.equal(account4Balance.toString(), web3.utils.toWei(threeMill));
  });

  it("should reject buyer 4, max tokens purchased", async () => {
    await truffleAssert.reverts(
      web3.eth.sendTransaction({
          from: accounts[4], 
          to: preSale.address, 
          value: web3.utils.toWei('10') 
      }),
      "Max Tokens per wallet reached"
   );
  });

  it("should reject with Insufficient Tokens", async () => {
    await truffleAssert.reverts(
      web3.eth.sendTransaction({
          from: accounts[6], 
          to: preSale.address, 
          value: web3.utils.toWei('10') 
      }),
      "Insufficient Tokens avaialable"
   );
  });

  it("should be allowed to purchase smaller mount", async () => {
    const amount = '10000000';
    
    await web3.eth.sendTransaction({
        from: accounts[6], 
        to: preSale.address, 
        value: web3.utils.toWei('1')
    });

    const accountBalance = await token.balanceOf(accounts[6]);

    assert.equal(accountBalance.toString(), web3.utils.toWei(amount));
  });

  it("should reject finalizing from non-owner", async () => {
    await truffleAssert.reverts(preSale.finalize({from: accounts[2]}), 'Only Dev Can End this');
  });

  // fucking javascript
  it("should finalize and widthdraw funds", async () => {
    const ownerStartingBalance = await web3.eth.getBalance(accounts[0]);
    const collected = await preSale.collected();

    console.log(web3.utils.fromWei(ownerStartingBalance))

    console.log(web3.utils.fromWei(collected))

    await preSale.finalizeWithContractAddress(accounts[6]);

    const ownerEndingBalance = await web3.eth.getBalance(accounts[0]);

    console.log(web3.utils.fromWei(ownerEndingBalance))


    // const combinedBalance = web3.utils.fromWei(ownerStartingBalance) + web3.utils.toBN(collected);


    // console.log(combinedBalance)

  });


  it("should be closed", async () => {
    assert(preSale.isOpen(), false);
  });


});