let breezeCheckoutOpened = false;

export const markBreezeCheckoutOpened = () => {
  breezeCheckoutOpened = true;
};

export const resetBreezeCheckoutState = () => {
  breezeCheckoutOpened = false;
};

export const didBreezeCheckoutOpen = () => breezeCheckoutOpened;

export const getBreezeCheckoutState = () => ({
  opened: breezeCheckoutOpened,
});