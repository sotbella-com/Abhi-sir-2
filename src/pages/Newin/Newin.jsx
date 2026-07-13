import React, { Fragment } from "react";
import Newinnavbar from "./Newinnavbar";
import Newmiddle1 from "./Newmiddle1";
import Newmiddle2 from "./Newmiddle2";
import Newmiddle3 from "./Newmiddle3";
import NewMiddle4 from "./NewMiddle4";
import Newmiddle5 from "./Newmiddle5";
import Footer from "@/NewHomePage/components/footer/Footer";

const Newin = () => {
  return (
    <Fragment>
      <div style={{ overflow: "hidden" }}>
        <Newinnavbar />
        <Newmiddle1 />
        <Newmiddle2 />
        <Newmiddle3 />
        <Newmiddle5 />
        <NewMiddle4 />
        <Footer />
      </div>
    </Fragment>
  );
};

export default Newin;
