import React, { Fragment } from "react";
import Newinnavbar from "../pages/Newin/Newinnavbar";
import Accoundmid1 from "./Accoundmid1";
import Accountmid2 from "./Accountmid2";
import Accountmid3 from "./Accountmid3";
import Stylefooter from "@/pages/Collections/CollectionFooter";
import Accountmid4 from "./Accountmid4";
import Accountmid5 from "./Accountmid5";
import Accountmid6 from "./Accountmid6";
import Accountmid7 from "./Accountmid7";
import Footer from "@/NewHomePage/components/footer/Footer";

const Account = () => {
  return (
    <Fragment>
      <div style={{ overflow: "hidden" }}>
        <Newinnavbar />
        <div style={{ position: "relative", top: "80px", height: "1050px" }}>
          <section style={{ marginLeft: "44px" }}>
            <Accoundmid1 />
            <div className="container-fluid" style={{ padding: "0px 50px" }}>
              <div className="d-flex align-items-start col-md-12">
                <Accountmid2 />
                <div className="tab-content col-md-8" id="v-pills-tabContent">
                  <Accountmid3 />
                  <Accountmid4 />
                  <Accountmid5 />
                  <Accountmid6 />
                  <Accountmid7 />
                </div>
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </div>
    </Fragment>
  );
};

export default Account;
