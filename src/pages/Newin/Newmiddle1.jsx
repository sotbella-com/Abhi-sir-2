import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'

const Newmiddle1 = () => {
  return (
    <Fragment>
    <div className="section66">
      <div className="col-md-12 imagefullwidth1">
        <Link to="./allstyles.html">
          <div className="centered">Merry Christmas</div>
        </Link>
        <div className="bannerchristmas"> Enjoy upto 70% Off</div>
      </div>
    </div>

    <div className="container col-md-12 text-start">
      <div className="row">
        <p className="togglemenu" style={{ marginLeft: "0px" }}>
          Home {">"} Co-ords {">"}
        </p>
      </div>
    </div>
  </Fragment>
  )
}

export default Newmiddle1