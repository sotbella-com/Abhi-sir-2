import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { CURRENCY_SYMBOL } from "@/constants/constants";

const Accountmid7 = () => {
  return (
    <Fragment>
      <div
        className="tab-pane fade wallet"
        id="v-pills-wallet"
        role="tabpanel"
        aria-labelledby="v-pills-wallet-tab"
        tabIndex="0"
      >
        <div
          className="col-md-12"
          style={{ position: "relative", marginBottom: "20px", width: "832px" }}
        >
          <div className="wallet-header" style={{ width: " 98.4%" }}>
            <div className="title">
              <div className="tabs-heading" >WALLET</div>
            </div>
            <div className="balance">
              <div className="tabs-heading balance-heading">TOTAL BALANCE</div>
              <div className="total-amount">₹ 1000</div>
            </div>
          </div>
          <div className="card-container" style={{ width: " 98.4%" }}>
            <div className="card">
              <div className="transaction">
                <div className="id">Transaction ID: 10284659</div>
                <div className="amount" style={{ color: "red" }}>
                  - {CURRENCY_SYMBOL} 6899
                </div>
              </div>
              <div className="date">21/10/2024 | 06:39</div>
            </div>
            <div className="card add-money">
              <div className="transaction">
                <div className="id">Transaction ID: 10284659</div>
                <div className="amount">+ {CURRENCY_SYMBOL} 6899</div>
              </div>
              <div className="add-to-card">
                <button>Add To Wallet</button>
              </div>
              <div className="date">21/10/2024 | 06:39</div>
            </div>
          </div>
          <div className="view-all col-12" style={{ width: " 98.4%" }}>
            <Link to="#">VIEW ALL</Link>
          </div>
        </div>
      </div>
      <div
        className="tab-pane fade"
        id="v-pills-logout"
        role="tabpanel"
        aria-labelledby="v-pills-logout-tab"
        tabIndex="0"
        style={{ borderRadius: "50%" }}
      >
        You Logged Out Successfully
      </div>
    </Fragment>
  );
};

export default Accountmid7;
