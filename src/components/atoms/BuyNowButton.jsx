import React, { useState } from 'react';
import { Button, Spinner } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import GuestCartService from '../../api/services/guestCart';
import { useUnifiedCartStore } from '../../context/unifiedCartStore';
import { useAuth } from '../../context/AuthContext';
import { LoginFlowModal } from '../../components/compounds';
import { useAddressStore } from "@/context";

const BuyNowButton = ({
    productId,
    quantity = 1,
    variant = 'outline',
    colorScheme = 'black',
    size = 'md',
    isFullWidth = false,
    children = 'Buy Now',
    disabled = false,
    isOrderable = true,
    maxQty = 1,
    isHidden,
    ...props
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setBasket } = useUnifiedCartStore();
    const { isAuthenticated, user } = useAuth();
    const { fetchAddress } = useAddressStore();
    const [showLoginFlow, setShowLoginFlow] = useState(false);
    const [modalType, setModalType] = useState("");

    const handleBuyNow = async (skipAuth = false) => {
        // ✅ Validate product availability before proceeding
        if (!productId) {
            // toast.error('Product ID is missing');
            return;
        }

        if (!isOrderable) {
            // toast.info('This product size is not available');
            return;
        }

        if (maxQty === 0) {
            // toast.info('Selected size is out of stock');
            return;
        }

        if (quantity <= 0 || quantity > maxQty) {
            // toast.info(`Quantity must be between 1 and ${maxQty}`);
            return;
        }

        if (!isAuthenticated && skipAuth !== true) {
            setModalType("LOGIN");
            setShowLoginFlow(true);
            return;
        }

        setIsLoading(true);
        try {
            let tempBasketId;
            // 1. Create temporary basket
            // if (isAuthenticated) {
            const basket = await GuestCartService.createBasket({ temporary: true });
            tempBasketId = basket.basketId;

            if (!tempBasketId) {
                throw new Error('Failed to create temporary basket');
            }

            // 2. Add item to temporary basket
            await GuestCartService.addToBasket(productId, quantity, tempBasketId);
            // }

            // 3. Navigate to checkout with basketId
            // navigate(`/address?basketId=${tempBasketId}`);

            // ✅ Check for address and navigate accordingly
            // try {
            await fetchAddress({ customerId: user?.id });
            const latestAddresses = useAddressStore.getState().address;

            if (Array.isArray(latestAddresses) && latestAddresses.length > 0) {
                navigate(`/address?basketId=${tempBasketId}`, {
                    state: {
                        isHidden,
                    },
                });
            } else {
                if (isAuthenticated) {
                    navigate(`/Shipping?basketId=${tempBasketId}`);
                }
                else {
                    sessionStorage.setItem("buy_now_data", JSON.stringify({ productId, quantity }));
                    navigate(`/Shipping?buy_now=true&basketId=${tempBasketId}`);
                }
            }
        } catch (error) {
            setIsLoading(false);
        }
    };
    console.log(isHidden)

    return (
        <>
            <Button
                onClick={() => handleBuyNow(false)}
                variant={variant}
                colorScheme={colorScheme}
                size={size}
                width={isFullWidth ? '100%' : 'auto'}
                disabled={disabled || isLoading || !productId || !isOrderable || maxQty === 0}
                isLoading={isLoading}
                loadingText="Processing..."
                leftIcon={isLoading ? <Spinner size="sm" /> : undefined}
                {...props}
            >
                {children}
            </Button>
            <LoginFlowModal
                start={showLoginFlow}
                onCompletion={() => {
                    setShowLoginFlow(false);
                    handleBuyNow(true);
                }}
                onNewUser={() => {
                    setShowLoginFlow(false);
                    handleBuyNow(true);
                }}
                onPreorderClose={() => {
                    setShowLoginFlow(false);
                    handleBuyNow(true);
                }}
                modalType={modalType}
                setModalType={setModalType}
                isHidden={isHidden}
            />
        </>
    );
};

export default BuyNowButton;
