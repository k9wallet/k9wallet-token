const K9WalletToken = artifacts.require('K9WalletToken');

contract('K9WalletToken', accounts => {
  const _name = 'K9 Wallet Token';
  const _symbol = 'K9WT';
  const _decimals = 18;

  it("should put 2000000000 K9WalletToken in the first account", async () => {
    const instance = await K9WalletToken.deployed();
    const balance = await instance.balanceOf(accounts[0]);
    const weiBalance = web3.utils.fromWei(balance);

    assert.equal(weiBalance, 2000000000);
  });

  it("should match name", async () => {
    const token = await K9WalletToken.deployed();
    const name = await token.name();
    assert.equal(name, _name);
  });

  it("should match sybmol", async () => {
    const token = await K9WalletToken.deployed();
    const sym = await token.symbol();
    assert.equal(sym, _symbol);
  });

  it("should match decimals", async () => {
    const token = await K9WalletToken.deployed();
    const dec = await token.decimals();
    assert.equal(dec, _decimals);
  });
  
  
  it("should send coin correctly", async () => {
    // Get initial balances of first and second account.
    const account_one = accounts[0];
    const account_two = accounts[1];

    const amount = 10;

    const instance = await K9WalletToken.deployed();
    const meta = instance;

    const initBalance = await meta.balanceOf(account_one);
    const account_one_starting_balance = initBalance.toString();

    const init2balance = await meta.balanceOf(account_two);
    const account_two_starting_balance = init2balance.toString();
    await meta.transfer(account_two, amount);

    const endbalance = await meta.balanceOf(account_one);
    const account_one_ending_balance = endbalance.toString();

    const end2balance = await meta.balanceOf(account_two);
    const account_two_ending_balance = end2balance.toString();

    assert.equal(
      account_one_ending_balance,
      account_one_starting_balance - amount,
      "Amount wasn't correctly taken from the sender"
    );
    assert.equal(
      account_two_ending_balance,
      amount,
      "Amount wasn't correctly sent to the receiver"
    );
  });

});