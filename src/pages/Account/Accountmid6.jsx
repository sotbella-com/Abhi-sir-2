import React, { Fragment, useState } from 'react';

const Accountmid6 = () => {
  const [selectedAddress, setSelectedAddress] = useState('radioNoLabel1');

  const handleRadioChange = (event) => {
    setSelectedAddress(event.target.id);
  };

  return (
    <Fragment>
      <div className="tab-pane fade" id="v-pills-savedaddress" role="tabpanel"
        aria-labelledby="v-pills-savedaddress-tab" tabIndex="0" style={{ width: '832px' }}>
        <div>
          <div className="tabs-heading">SAVED ADDRESS</div>
          <div className="col-md-12" style={{ border: '1px solid #888888', position: 'relative', marginBottom: '20px',width: ' 99%' }}>
            <div className="row m-0">
              <div className="col-md-12 remove-padding save-address-card">
                <div className="save-address-radio">
                  <p className="radio">
                    <input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel1" value="" aria-label="..." checked={selectedAddress === 'radioNoLabel1'} onChange={handleRadioChange} />
                  </p>
                </div>
                <div className="coupontab coupon-card">
                  <p className="coupon-card-heading">Aritra Paul (Default)</p>
                  <div className="sa-card-description">
                    <p style={{ margin: '5px 0' }}>A-216, Sector - 83, Noida, Uttar Pradesh, 201308</p>
                    <p>Mobile: 7059285044</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-12" style={{ border: '1px solid #888888', position: 'relative', marginBottom: '20px',width: ' 99%' }}>
            <div className="row m-0">
              <div className="col-md-12 remove-padding save-address-card">
                <div className="save-address-radio">
                  <p className="radio">
                    <input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel2" value="" aria-label="..." checked={selectedAddress === 'radioNoLabel2'} onChange={handleRadioChange} />
                  </p>
                </div>
                <div className="coupontab coupon-card">
                  <p className="coupon-card-heading">John Deo</p>
                  <div className="sa-card-description">
                    <p style={{ margin: '5px 0' }}>A-216, Sector - 83, Noida, Uttar Pradesh, 201308</p>
                    <p className="sa-mobile">Mobile: 7059285044</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-12" style={{ border: '1px solid #888888', position: 'relative', marginBottom: '20px',width: ' 99%' }}>
            <div className="row m-0">
              <div className="col-md-12 remove-padding save-address-card">
                <div className="save-address-radio">
                  <p className="radio">
                    <input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel3" value="" aria-label="..." checked={selectedAddress === 'radioNoLabel3'} onChange={handleRadioChange} />
                  </p>
                </div>
                <div className="coupontab coupon-card">
                  <p className="coupon-card-heading">John Deo</p>
                  <div className="sa-card-description">
                    <p style={{ margin: '5px 0' }}>A-216, Sector - 83, Noida, Uttar Pradesh, 201308</p>
                    <p className="sa-mobile">Mobile: 7059285044</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-12" style={{ border: '1px solid #888888', position: 'relative', marginBottom: '20px',width: ' 99%' }}>
            <div className="row m-0">
              <div className="col-md-12 remove-padding save-address-card">
                <div className="save-address-radio">
                  <p className="radio">
                    <input className="form-check-input" type="radio" name="radioNoLabel" id="radioNoLabel4" value="" aria-label="..." checked={selectedAddress === 'radioNoLabel4'} onChange={handleRadioChange} />
                  </p>
                </div>
                <div className="coupontab coupon-card">
                  <p className="coupon-card-heading">John Deo</p>
                  <div className="sa-card-description">
                    <p style={{ margin: '5px 0' }}>A-216, Sector - 83, Noida, Uttar Pradesh, 201308</p>
                    <p className="sa-mobile">Mobile: 7059285044</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Accountmid6;

