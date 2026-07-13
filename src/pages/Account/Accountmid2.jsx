import { Fragment } from "react";
import img1 from "@/assets/images/iconwallet.jpeg";

const Accountmid2 = () => {
  return (
    <Fragment>
      <div
        className="nav flex-column nav-pills me-4 col-md-4"
        id="v-pills-tab"
        role="tablist"
        aria-orientation="vertical"
      >
        <button
          className="nav-link custom-nav-links d-flex align-items-center justify-content-between active"
          id="v-pills-orders-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-orders"
          type="button"
          role="tab"
          aria-controls="v-pills-orders"
          aria-selected="true"
        >
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              style={{ margin: "0" }}
            >
              <path
                d="M13.3028 29.217V17.4336L11.3182 13.1085C11.2508 12.9537 11.2482 12.79 11.3105 12.6174C11.3728 12.4448 11.4821 12.3242 11.6383 12.2557C11.7945 12.1872 11.9601 12.1838 12.1351 12.2456C12.3101 12.3073 12.4309 12.4144 12.4974 12.5666L14.6908 17.3701H29.8405L32.0338 12.5679C32.1012 12.4131 32.222 12.3048 32.3962 12.243C32.5711 12.1813 32.7367 12.1859 32.893 12.257C33.0492 12.3238 33.1584 12.444 33.2207 12.6174C33.283 12.7908 33.2805 12.9546 33.2131 13.1085L31.2284 17.4336V29.217C31.2284 29.7839 31.027 30.2674 30.6241 30.6676C30.2212 31.0669 29.7334 31.2666 29.1606 31.2666H15.3707C14.7988 31.2666 14.3109 31.0669 13.9072 30.6676C13.5043 30.2683 13.3028 29.7847 13.3028 29.217ZM19.7048 23.0176H24.8264C25.0091 23.0176 25.1615 22.9571 25.2835 22.8361C25.4056 22.7151 25.4666 22.5641 25.4666 22.383C25.4666 22.202 25.4056 22.0509 25.2835 21.93C25.1615 21.809 25.0091 21.7485 24.8264 21.7485H19.7048C19.523 21.7485 19.3706 21.809 19.2477 21.93C19.1248 22.0509 19.0638 22.202 19.0646 22.383C19.0655 22.5641 19.1265 22.7151 19.2477 22.8361C19.3689 22.9571 19.5213 23.0176 19.7048 23.0176ZM15.3719 29.9975H29.1606C29.3902 29.9975 29.5788 29.9243 29.7265 29.778C29.8742 29.6316 29.948 29.4446 29.948 29.217V18.6392H14.5832V29.217C14.5832 29.4446 14.6571 29.6316 14.8047 29.778C14.9524 29.9243 15.1415 29.9975 15.3719 29.9975Z"
                fill="black"
              />
              <circle cx="22" cy="22" r="21.5" stroke="black" />
            </svg>
          </div>
          <div className="text-md-start" style={{ width: "80%" }}>
            <div className="pills-heading">Orders</div>
            <div className="pills-text">See or track your orders</div>
          </div>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="7"
              height="12"
              viewBox="0 0 7 12"
              fill="none"
              style={{ margin: "0" }}
            >
              <path
                d="M0.939394 0L0 0.978947L4.81818 6L0 11.0211L0.939394 12L6.66667 6L0.939394 0Z"
                fill="black"
              />
            </svg>
          </div>
        </button>

        <div
          style={{ background: "#D9D9D9", height: "1px", width: "100%" }}
        ></div>
        <button
          className="nav-link custom-nav-links d-flex align-items-center justify-content-between"
          id="v-pills-coupon-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-coupon"
          type="button"
          role="tab"
          aria-controls="v-pills-coupon"
          aria-selected="false"
        >
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              style={{ margin: "0" }}
            >
              <path
                d="M23.406 20.6253H22.6345C22.064 20.6253 21.6002 20.0875 21.6002 19.426V18.5315C21.6002 17.87 22.064 17.3323 22.6345 17.3323H23.406C23.9765 17.3323 24.4404 17.87 24.4404 18.5315V19.426C24.4404 20.0875 23.9765 20.6253 23.406 20.6253ZM22.6356 18.3336C22.5413 18.3336 22.4638 18.4221 22.4638 18.5328V19.4274C22.4638 19.5367 22.5402 19.6266 22.6356 19.6266H23.4071C23.5015 19.6266 23.579 19.538 23.579 19.4274V18.5328C23.579 18.4234 23.5026 18.3336 23.4071 18.3336H22.6356ZM26.9639 25.6669H26.1924C25.6219 25.6669 25.1581 25.1292 25.1581 24.4677V23.5732C25.1581 22.913 25.6219 22.3739 26.1924 22.3739H26.9639C27.5344 22.3739 27.9983 22.9117 27.9983 23.5732V24.4677C27.9983 25.1279 27.5344 25.6669 26.9639 25.6669ZM26.1935 23.3753C26.0992 23.3753 26.0217 23.4651 26.0217 23.5745V24.469C26.0217 24.5784 26.0981 24.6682 26.1935 24.6682H26.965C27.0594 24.6682 27.1369 24.5784 27.1369 24.469V23.5745C27.1369 23.4651 27.0605 23.3753 26.965 23.3753H26.1935ZM22.7728 25.4664L27.5166 18.1331C27.6592 17.9117 27.621 17.5992 27.4301 17.4325C27.2403 17.2672 26.9697 17.3114 26.8259 17.5328L22.0822 24.8661C21.9395 25.0875 21.9777 25.4013 22.1686 25.5667C22.2461 25.6344 22.3371 25.6669 22.4269 25.6669C22.5583 25.6669 22.6875 25.5979 22.7717 25.4664H22.7728ZM17.7562 26.2229C17.5182 26.2229 17.325 25.9989 17.325 25.7229V24.3153C17.325 24.0393 17.5182 23.8153 17.7562 23.8153C17.9943 23.8153 18.1875 24.0393 18.1875 24.3153V25.7229C18.1875 25.9989 17.9943 26.2229 17.7562 26.2229ZM17.7562 22.7032C17.5182 22.7032 17.325 22.4793 17.325 22.2032V20.7957C17.325 20.5196 17.5182 20.2957 17.7562 20.2957C17.9943 20.2957 18.1875 20.5196 18.1875 20.7957V22.2032C18.1875 22.4793 17.9943 22.7032 17.7562 22.7032ZM17.7562 19.1849C17.5182 19.1849 17.325 18.9609 17.325 18.6849V17.2773C17.325 17.0013 17.5182 16.7773 17.7562 16.7773C17.9943 16.7773 18.1875 17.0013 18.1875 17.2773V18.6849C18.1875 18.9609 17.9943 19.1849 17.7562 19.1849ZM33.5688 20C33.8068 20 34 19.776 34 19.5V16.1667C34 15.8906 33.8068 15.6667 33.5688 15.6667C33.014 15.6667 32.5625 15.1432 32.5625 14.5C32.5625 14.224 32.3693 14 32.1313 14H12.8688C12.6307 14 12.4375 14.224 12.4375 14.5C12.4375 15.1432 11.986 15.6667 11.4312 15.6667C11.1932 15.6667 11 15.8906 11 16.1667V19.5C11 19.776 11.1932 20 11.4312 20C12.1444 20 12.725 20.6732 12.725 21.5C12.725 22.3268 12.1444 23 11.4312 23C11.1932 23 11 23.224 11 23.5V26.8333C11 27.1094 11.1932 27.3333 11.4312 27.3333C11.986 27.3333 12.4375 27.8568 12.4375 28.5C12.4375 28.776 12.6307 29 12.8688 29H32.1313C32.3693 29 32.5625 28.776 32.5625 28.5C32.5625 27.8568 33.014 27.3333 33.5688 27.3333C33.8068 27.3333 34 27.1094 34 26.8333V23.5C34 23.224 33.8068 23 33.5688 23C32.8556 23 32.275 22.3268 32.275 21.5C32.275 20.6732 32.8556 20 33.5688 20ZM33.1375 23.9507V26.3921C32.4524 26.5796 31.9123 27.2059 31.7505 28.0001H18.1874V27.8335C18.1874 27.5574 17.9943 27.3335 17.7562 27.3335C17.5181 27.3335 17.3249 27.5574 17.3249 27.8335V28.0001H13.2493C13.0876 27.2059 12.5474 26.5796 11.8624 26.3921V23.9507C12.8451 23.7189 13.5874 22.7085 13.5874 21.5001C13.5874 20.2931 12.8451 19.2827 11.8624 19.0509V16.6095C12.5474 16.422 13.0876 15.7957 13.2493 15.0014H17.3249V15.1681C17.3249 15.4441 17.5181 15.6681 17.7562 15.6681C17.9943 15.6681 18.1874 15.4441 18.1874 15.1681V15.0014H31.7505C31.9123 15.7957 32.4524 16.422 33.1375 16.6095V19.0509C32.1548 19.2827 31.4125 20.2931 31.4125 21.5001C31.4125 22.7072 32.1548 23.7176 33.1375 23.9507Z"
                fill="black"
              />
              <circle cx="22" cy="22" r="21.5" stroke="black" />
            </svg>
          </div>
          <div className="text-md-start" style={{ width: "80%" }}>
            <div className="pills-heading">Coupons</div>
            <div className="pills-text">
              Manage coupons for additional discounts
            </div>
          </div>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="7"
              height="12"
              viewBox="0 0 7 12"
              fill="none"
              style={{ margin: "0" }}
            >
              <path
                d="M0.939394 0L0 0.978947L4.81818 6L0 11.0211L0.939394 12L6.66667 6L0.939394 0Z"
                fill="black"
              />
            </svg>
          </div>
        </button>
        <div
          style={{ background: "#D9D9D9", height: "1px", width: "100%" }}
        ></div>

        <button
          className="nav-link custom-nav-links d-flex align-items-center justify-content-between"
          id="v-pills-wallet-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-wallet"
          type="button"
          role="tab"
          aria-controls="v-pills-wallet"
          aria-selected="false"
        >
          <div>
            <img src={img1} alt="Wallet Icon" style={{ borderRadius: "50%" }} />
          </div>
          <div className="text-md-start" style={{ width: "80%" }}>
            <div className="pills-heading">Wallet & transaction</div>
            <div className="pills-text">
              Check your wallet balance & transaction history
            </div>
          </div>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="7"
              height="12"
              viewBox="0 0 7 12"
              fill="none"
              style={{ margin: "0" }}
            >
              <path
                d="M0.939394 0L0 0.978947L4.81818 6L0 11.0211L0.939394 12L6.66667 6L0.939394 0Z"
                fill="black"
              />
            </svg>
          </div>
        </button>
        <div
          style={{ background: "#D9D9D9", height: "1px", width: "100%" }}
        ></div>

        <button
          className="nav-link custom-nav-links d-flex align-items-center justify-content-between"
          id="v-pills-wishlist-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-wishlist"
          type="button"
          role="tab"
          aria-controls="v-pills-wishlist"
          aria-selected="false"
        >
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              style={{ margin: "0" }}
            >
              <circle cx="22" cy="22" r="21.5" stroke="black" />
              <path
                d="M22.0712 33C24.489 33 34.1423 26.3716 34.1423 20.5769C34.1423 16.9488 30.7799 14 26.6499 14C25.1101 14 23.7866 14.4096 22.5963 15.2532L22.0712 15.6257L21.546 15.2532C20.3558 14.4096 19.0274 14 17.4925 14C13.3625 14 10 16.9488 10 20.5769C10 26.3716 19.6532 33 22.0712 33ZM12.2015 18.3989C13.1999 16.492 15.4112 15.3445 17.8338 15.4715C19.224 15.5443 20.302 16.0638 21.4467 17.2028L21.7881 17.5425C21.8499 17.6053 21.9589 17.6453 22.071 17.6453C22.1832 17.6453 22.2922 17.6082 22.354 17.5425L22.6954 17.2028C23.8401 16.0624 24.9181 15.5443 26.3083 15.4715C28.731 15.3402 30.9407 16.4906 31.9406 18.3989C32.7145 19.8818 32.656 21.5446 31.765 23.3429C29.7504 27.4092 23.9066 31.0233 22.3328 31.48L22.071 31.5571L21.8092 31.48C20.2402 31.0233 14.3917 27.4092 12.3771 23.3429C11.486 21.5445 11.4276 19.8831 12.2015 18.3989Z"
                fill="black"
              />
            </svg>
          </div>
          <div className="text-md-start" style={{ width: "80%" }}>
            <div className="pills-heading">Wishlist</div>
            <div className="pills-text">Check your wished items</div>
          </div>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="7"
              height="12"
              viewBox="0 0 7 12"
              fill="none"
              style={{ margin: "0" }}
            >
              <path
                d="M0.939394 0L0 0.978947L4.81818 6L0 11.0211L0.939394 12L6.66667 6L0.939394 0Z"
                fill="black"
              />
            </svg>
          </div>
        </button>

        <div
          style={{ background: "#D9D9D9", height: "1px", width: "100%" }}
        ></div>

        <button
          className="nav-link custom-nav-links d-flex align-items-center justify-content-between"
          id="v-pills-savedaddress-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-savedaddress"
          type="button"
          role="tab"
          aria-controls="v-pills-savedaddress"
          aria-selected="false"
        >
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              style={{ margin: "0" }}
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M22.0007 33.7919L22.9262 32.7491C23.9763 31.5465 24.9208 30.4054 25.7612 29.3201L26.455 28.4049C29.3516 24.5021 30.8007 21.4045 30.8007 19.115C30.8007 14.2281 26.8612 10.2666 22.0007 10.2666C17.1402 10.2666 13.2007 14.2281 13.2007 19.115C13.2007 21.4045 14.6498 24.5021 17.5464 28.4049L18.2402 29.3201C19.4391 30.8562 20.6934 32.3469 22.0007 33.7919Z"
                stroke="black"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22.0007 22.7332C24.0257 22.7332 25.6673 21.0916 25.6673 19.0666C25.6673 17.0415 24.0257 15.3999 22.0007 15.3999C19.9756 15.3999 18.334 17.0415 18.334 19.0666C18.334 21.0916 19.9756 22.7332 22.0007 22.7332Z"
                stroke="black"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="22" cy="22" r="21.5" stroke="black" />
            </svg>
          </div>
          <div className="text-md-start" style={{ width: "80%" }}>
            <div className="pills-heading">Saved Address</div>
            <div className="pills-text">Make changes to your saved address</div>
          </div>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="7"
              height="12"
              viewBox="0 0 7 12"
              fill="none"
              style={{ margin: "0" }}
            >
              <path
                d="M0.939394 0L0 0.978947L4.81818 6L0 11.0211L0.939394 12L6.66667 6L0.939394 0Z"
                fill="black"
              />
            </svg>
          </div>
        </button>
        <div
          style={{ background: "#D9D9D9", height: "1px", width: "100%" }}
        ></div>

        <button
          className="nav-link custom-nav-links d-flex align-items-center justify-content-between"
          id="v-pills-logout-tab"
          data-bs-toggle="pill"
          data-bs-target="#v-pills-logout"
          type="button"
          role="tab"
          aria-controls="v-pills-logout"
          aria-selected="false"
        >
          <div>
            <img src={img1} alt="Wallet Icon" style={{ borderRadius: "50%" }} />
          </div>
          <div className="text-md-start" style={{ width: "80%" }}>
            <div className="pills-heading">LOG OUT</div>
          </div>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="7"
              height="12"
              viewBox="0 0 7 12"
              fill="none"
              style={{ margin: "0" }}
            >
              <path
                d="M0.939394 0L0 0.978947L4.81818 6L0 11.0211L0.939394 12L6.66667 6L0.939394 0Z"
                fill="black"
              />
            </svg>
          </div>
        </button>
      </div>
    </Fragment>
  );
};

export default Accountmid2;
