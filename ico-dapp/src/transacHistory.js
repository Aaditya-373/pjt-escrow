// TransactionHistory.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const GANACHE_URL = 'http://127.0.0.1:7545'; // Replace with your Ganache endpoint

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      const address = localStorage.getItem('ethereumAddress')?.toLowerCase() || "0xF202FE93eF4c909f7398078Ea1bD48bE7537aDB6"; // Retrieve address from localStorage
      
      if (!address) {
        setError("Address not found in localStorage.");
        return;
      }

      const transactionsList = [];
      try {
        // Get the latest block number
        const latestBlockNumberResponse = await axios.post(GANACHE_URL, {
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        });

        const latestBlockNumber = parseInt(latestBlockNumberResponse.data.result, 16);

        // Iterate through all blocks up to the latest block number
        for (let i = 0; i <= latestBlockNumber; i++) {
          // Get the number of transactions in the current block
          const countResponse = await axios.post(GANACHE_URL, {
            jsonrpc: '2.0',
            method: 'eth_getBlockTransactionCountByNumber',
            params: [`0x${i.toString(16)}`],
            id: 1,
          });

          const transCount = parseInt(countResponse.data.result, 16);

          // Loop through each transaction by index in the current block
          for (let index = 0; index < transCount; index++) {
            const txResponse = await axios.post(GANACHE_URL, {
              jsonrpc: '2.0',
              method: 'eth_getTransactionByBlockNumberAndIndex',
              params: [`0x${i.toString(16)}`, `0x${index.toString(16)}`],
              id: 1,
            });

            const transaction = txResponse.data.result;
            console.log(transaction)
            // Check if the transaction involves the specified address
            if (
              transaction &&
              (transaction.from.toLowerCase() === address ||
                (transaction.to && transaction.to.toLowerCase() === address))
            ) {
              transactionsList.push(transaction);
            }
          }
        }

        // Set the list of transactions to state
        setTransactions(transactionsList);
      } catch (err) {
        console.error('Error fetching transaction history:', err);
        setError('Error fetching transaction history');
      }
    };

    fetchTransactionHistory();
  }, [transactions]);

  return (
    <div>
      <h2>Transaction History</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {transactions.length > 0 ? (
        <ul>
          {transactions.map((tx, index) => (
            <li key={index}>
              <p>From: {tx.from}</p>
              <p>To: {tx.to}</p>
              <p>Value: {parseInt(tx.value, 16)} Wei</p>
              <p>Hash: {tx.hash}</p>
              <hr />
            </li>
          ))}
        </ul>
      ) : (
        <p>No transactions found.</p>
      )}
    </div>
  );
};

export default TransactionHistory;
