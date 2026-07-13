import React, { Fragment } from "react";
import img from "@/assets/images/jhondoe.jfif";

const Accoundmid1 = () => {
  return (
    <Fragment>
      <div className="container col-md-12 text-start">
        <div className="row">
          <p
            className="togglemenu"
            style={{ marginTop: "48px", marginBottom: "48px" }}
          >
            Home &gt; My Account
          </p>
        </div>
      </div>
      <div className="container persondetails">
        <div className="row">
          <div className="col-md-1">
            <img src={img} className="jhondoe" />
          </div>

          <div className="col-md-2">
            <ul className="liststyle">
              <li>
                <p className="accoountholdername">JHON DOE</p>
              </li>
              <li>
                <p className="accoountholderemail" type="email">
                  johndeo@gmail.com
                </p>
              </li>

              <li>
                <p className="edittext">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    style={{ margin: "0" }}
                  >
                    <path
                      d="M0.874999 13.125H1.83575L11.1965 3.76426L10.2357 2.80351L0.874999 12.1643V13.125ZM0 14V11.795L11.5325 0.252013C11.6229 0.172097 11.7221 0.110263 11.83 0.0665134C11.9379 0.0227634 12.0508 0.00059659 12.1686 1.32575e-05C12.2864 -0.000570075 12.4002 0.0180967 12.5099 0.0560133C12.6207 0.0927633 12.7228 0.159263 12.8161 0.255513L13.7497 1.19526C13.846 1.28801 13.9119 1.3901 13.9475 1.50151C13.9825 1.61235 14 1.72318 14 1.83401C14 1.95301 13.9802 2.06676 13.9405 2.17526C13.9002 2.28318 13.8367 2.38205 13.7497 2.47189L2.20412 14H0ZM10.7082 3.29176L10.2357 2.80351L11.1965 3.76426L10.7082 3.29176Z"
                      fill="black"
                    />
                  </svg>
                  &nbsp; EDIT
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Accoundmid1;
