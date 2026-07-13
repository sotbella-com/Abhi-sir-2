import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Image,
  Input,
  Checkbox,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";

import howToMeasure from "@/assets/images/howToMeasure.png";
import abdominalShape from "@/assets/images/abdominalShape.png";
import hipShape from "@/assets/images/hipShape.png";
import hipMedium from "@/assets/images/hip_medium.png";
import hipWide from "@/assets/images/hip_wide.png";
import abdoMedium from "@/assets/images/abdo_medium.png";
import abdoBulging from "@/assets/images/abdo_bulging.png";
import finalShape from "@/assets/images/finalShape.png";

import { toast } from "react-toastify";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { useMobile } from "@/components/molecules";
import { getSizeGuideContent } from "@/api/services/contentService";
import SizeGuideShimmer from "@/components/SizeGuide/SizeGuideShimmer";

/** ------ local helper: compute recommended size (no API) ------ */
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function clampSizeIndex(i) {
  return Math.max(0, Math.min(SIZES.length - 1, i));
}

/**
 * Very simple heuristic:
 * - Base on BMI
 * - Adjust by body shapes
 * - Adjust by clothing preference (1=tighter, 3=looser)
 */
function computeRecommendedSize({ heightCm, weight, abdominalShape, hipShape, clothingPreference }) {
  const h = parseFloat(heightCm);
  const w = parseFloat(weight);
  if (!h || !w || h <= 0) return null;

  const bmi = w / Math.pow(h / 100, 2);

  // base index from BMI
  let idx;
  if (bmi < 19) idx = 0;            // XS
  else if (bmi < 21.5) idx = 1;     // S
  else if (bmi < 24) idx = 2;       // M
  else if (bmi < 27) idx = 3;       // L
  else if (bmi < 30) idx = 4;       // XL
  else idx = 5;                     // XXL

  // body-shape adjustments
  if (abdominalShape === "Bulging") idx += 1;
  if (abdominalShape === "Flat") idx -= 0.5; // tiny nudge
  if (hipShape === "Wide") idx += 1;
  if (hipShape === "Straight") idx -= 0.5;

  // clothing preference adjustments
  if (clothingPreference === "1") idx -= 1;       // very fitted → downsize
  else if (clothingPreference === "3") idx += 1;  // very loose → upsize

  idx = clampSizeIndex(Math.round(idx));
  return SIZES[idx];
}

const SizeChartPopup = ({ handleClose, open, onComplete = () => { } }) => {
  const isMobile = useMobile();

  const [showSizeRecommendation, setShowSizeRecommendation] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(true);
  const [unit, setUnit] = useState("cm");
  const [showBodyShapeForm, setShowBodyShapeForm] = useState(false);
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  const [lastSubmittedFormData, setLastSubmittedFormData] = useState(null);

  const [formData, setFormData] = useState({
    heightCm: "",
    weight: "",
    age: "",
    abdominalShape: "",
    hipShape: "",
    clothingPreference: "2",
    isChecked: false,
  });

  const [recommendationData, setRecommendationData] = useState(null);
  const [guideData, setGuideData] = useState(null);
  const [loadingGuide, setLoadingGuide] = useState(false);

  const cmToIn = (cm) => (cm ? (parseFloat(cm) / 2.54).toFixed(1) : "");
  const inToCm = (inch) => (inch ? (parseFloat(inch) * 2.54).toFixed(1) : "");
  const percent = ((Number(formData.clothingPreference) - 1) / (3 - 1)) * 100;
  const heightDisplay = unit === "cm" ? formData.heightCm : formData.heightCm;

  const handleHeightChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setFormData((p) => ({ ...p, heightCm: "" }));
      return;
    }
    setFormData((p) => ({
      ...p,
      // heightCm: unit === "cm" ? val : inToCm(val),
      heightCm: unit === "cm" ? val : (val),
    }));
  };

  const handleUnitChange = (newUnit) => {
    if (newUnit !== unit) setUnit(newUnit);
  };

  const handleFinalSummary = () => {
    // compute locally
    const recommendedSize = computeRecommendedSize({
      heightCm: formData.heightCm,
      weight: formData.weight,
      abdominalShape: formData.abdominalShape,
      hipShape: formData.hipShape,
      clothingPreference: formData.clothingPreference,
    });

    if (!recommendedSize) {
      // toast.error("Please enter valid height and weight to get a recommendation.");
      return;
    }

    const payload = { recommendedSize };
    setRecommendationData(payload);
    localStorage.setItem(LOCAL_KEYS.DEFAULT_SIZE, JSON.stringify(payload.recommendedSize));
    setShowFinalSummary(true);
  };

  const handleRecommendationClick = () => {
    setShowSizeRecommendation(true);
    setShowSizeChart(false);
  };

  const handleShapeSelect = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = () =>
    setFormData((prev) => ({ ...prev, isChecked: !prev.isChecked }));

  // reset on close
  useEffect(() => {
    if (!open) {
      setShowSizeRecommendation(false);
      setShowSizeChart(true);
      setUnit("cm");
      setShowBodyShapeForm(false);
      setShowFinalSummary(false);
      setFormData({
        heightCm: "",
        weight: "",
        age: "",
        abdominalShape: "",
        hipShape: "",
        clothingPreference: "2",
        isChecked: false,
      });
      setRecommendationData(null);
    }
  }, [open]);

  // lock scroll when open
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const prevCssText = document.body.style.cssText;
    const scrollBarW = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    if (scrollBarW > 0) document.body.style.paddingRight = `${scrollBarW}px`;

    return () => {
      document.body.style.cssText = prevCssText || "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setLoadingGuide(true);
      getSizeGuideContent()
        .then((resp) => {
          if (resp?.body) {
            setGuideData(resp.body);
          }
        })
        .catch((err) => {
          // console.error("Failed to load size guide content", err);
        })
        .finally(() => {
          setLoadingGuide(false);
        });
    }
  }, [open]);

  const apiUnitKey = unit === "cm" ? "cm" : "inches";

  if (!open) return null;

  return (
    <Flex position="fixed" inset={0} align="center" justify="center" bg="blackAlpha.600" zIndex={1000}>
      <Box
        bg="white"
        w="90%"
        maxW="800px"
        h="90vh"
        overflowY="auto"
        className="scrollbar-hide"
        p={{ base: 4, md: 6 }}
        pt={{ base: 4, md: 2 }}
        position="relative"
      >
        <Button
          position="absolute"
          top={2}
          right={4}
          variant="ghost"
          fontSize="2xl"
          p={0}
          minW="auto"
          onClick={handleClose}
          _hover={{ bg: "transparent" }}
        >
          ×
        </Button>

        {loadingGuide ? (
          <SizeGuideShimmer />
        ) : (
          <Box textAlign="left">
            <Text fontSize={isMobile ? "14px" : "28px"}>
              {guideData?.heading || "Find Your Best Fit"}
            </Text>

            <Text fontSize={isMobile ? "10px" : "14px"} mt={1}>
              {showSizeRecommendation
                ? "Discover the best style tailored to your unique body shape. Select your abdominal and hip shape to get personalized fit recommendations that flatter you the most."
                : ""}
            </Text>

            {showSizeChart && !showSizeRecommendation && (
              <>
                <Text fontSize={isMobile ? "10px" : "14px"} mt={2}>
                  {guideData?.["sub-heading"] ||
                    "All our styles are tailored to celebrate diverse body types. Refer to the size chart below for the best fit. If you're between sizes, we recommend sizing up for comfort."}
                </Text>

                <Flex justify="space-between" align="center" mt={6} mb={3}>
                  <Flex>
                    <Button
                      borderRadius="0"
                      variant={unit === "cm" ? "solid" : "outline"}
                      colorScheme="blackAlpha"
                      bg={unit === "cm" ? "black" : "transparent"}
                      color={unit === "cm" ? "white" : "black"}
                      borderColor="black"
                      h="32px"
                      px="2.5"
                      fontWeight={"normal"}
                      fontSize={{ base: "10px", md: "sm" }}
                      onClick={() => handleUnitChange("cm")}
                      _hover={{ bg: unit === "cm" ? "black" : "transparent" }}
                      _active={{ bg: unit === "cm" ? "black" : "transparent" }}
                      _focusVisible={{ boxShadow: "none" }}
                    >
                      Cm
                    </Button>

                    <Button
                      borderRadius="0"
                      variant={unit === "in" ? "solid" : "outline"}
                      colorScheme="blackAlpha"
                      bg={unit === "in" ? "black" : "transparent"}
                      color={unit === "in" ? "white" : "black"}
                      borderColor="black"
                      h="32px"
                      px="2.5"
                      fontWeight={"normal"}
                      fontSize={{ base: "10px", md: "sm" }}
                      onClick={() => handleUnitChange("in")}
                      _hover={{ bg: unit === "in" ? "black" : "transparent" }}
                      _active={{ bg: unit === "in" ? "black" : "transparent" }}
                      _focusVisible={{ boxShadow: "none" }}
                    >
                      Inches
                    </Button>
                  </Flex>

                  <Button
                    borderRadius="0"
                    variant={showSizeRecommendation ? "solid" : "outline"}
                    colorScheme="blackAlpha"
                    bg={showSizeRecommendation ? "black" : "transparent"}
                    color={showSizeRecommendation ? "white" : "black"}
                    borderColor="black"
                    h="32px"
                    px="2.5"
                    fontWeight={"semibold"}
                    fontSize={{ base: "10px", md: "sm" }}
                    onClick={handleRecommendationClick}
                    _hover={{ bg: showSizeRecommendation ? "black" : "transparent" }}
                    _active={{ bg: showSizeRecommendation ? "black" : "transparent" }}
                    _focusVisible={{ boxShadow: "none" }}
                  >
                    Find Your Perfect Sizee
                  </Button>
                </Flex>
              </>
            )}

            {/* Recommendation Flow */}
            {showSizeRecommendation && !showSizeChart ? (
              <>
                {showFinalSummary ? (
                  <Box w="90%" maxW="395px" mx="auto" textAlign="center" fontSize={{ base: "xs", md: "sm" }} mt={6}>
                    <Text>
                      Your Size is{" "}
                      <Text as="strong">{recommendationData?.recommendedSize || "__"}</Text>
                    </Text>

                    <Image alt="Final Shape" src={finalShape} mx="auto" mt={2} />

                    <Text fontSize={{ base: "sm", md: "15px" }} mt={1}>
                      {formData.abdominalShape} / {formData.hipShape}
                    </Text>
                    <Text fontSize={{ base: "xs", md: "13px" }} mt={1}>
                      {formData.heightCm || "__"} cm / {cmToIn(formData.heightCm) || "__"} in &nbsp;/ {formData.weight} kg /{" "}
                      {formData.age} Years
                    </Text>
                    <Text fontSize={{ base: "xs", md: "13px" }} mt={1}>
                      Adjustment:{" "}
                      {formData.clothingPreference === "1"
                        ? "Very Fitted"
                        : formData.clothingPreference === "3"
                          ? "Very Loose"
                          : "Normal"}
                    </Text>

                    <Flex justify="center" gap={1} mt={0} direction="column">
                      <Button
                        variant="link"
                        mt={2}
                        onClick={() => {
                          setShowFinalSummary(false);
                          setShowBodyShapeForm(true);
                          if (lastSubmittedFormData) setFormData(lastSubmittedFormData);
                        }}
                        fontSize={"xs"}
                        color={"black"}
                        fontWeight={"normal"}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="link"
                        mt={1}
                        onClick={() => {
                          setShowFinalSummary(false);
                          setShowSizeRecommendation(false);
                          setShowSizeChart(true);
                          setFormData({
                            heightCm: "",
                            weight: "",
                            age: "",
                            abdominalShape: "",
                            hipShape: "",
                            clothingPreference: "2",
                            isChecked: false,
                          });
                          setRecommendationData(null);
                        }}
                        fontSize={"xs"}
                        color={"black"}
                        fontWeight={"normal"}
                      >
                        Delete Details
                      </Button>
                    </Flex>
                    <Button
                      w="full"
                      mt={4}
                      bg="black"
                      color="white"
                      borderRadius="0"
                      _hover={{ opacity: 0.9 }}
                      onClick={() => {
                        setShowFinalSummary(false);
                        setShowSizeRecommendation(false);
                        setShowSizeChart(true);
                        setFormData({
                          heightCm: "",
                          weight: "",
                          age: "",
                          abdominalShape: "",
                          hipShape: "",
                          clothingPreference: "2",
                          isChecked: false,
                        });
                        onComplete(recommendationData);
                        handleClose();
                      }}
                    >
                      CONTINUE SHOPPING
                    </Button>
                  </Box>
                ) : !showBodyShapeForm ? (
                  // Step 1: Basic info
                  <Box
                    as="form"
                    w="90%"
                    maxW="490px"
                    mx="auto"
                    fontSize="sm"
                    mt={6}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!formData.isChecked) {
                        // toast.error("Please confirm these measurements are accurate.");
                      } else {
                        setShowBodyShapeForm(true);
                      }
                    }}
                  >
                    {/* Height */}
                    <Box my={3}>
                      <Flex align="flex-end" justify="space-between">
                        <Text
                          as="label"
                          htmlFor="height"
                          fontSize="sm"
                          fontWeight="medium"
                          mb={2}
                        >
                          Height{" "}
                          <Text
                            as="span"
                            fontSize={isMobile ? "10px" : "11px"}
                            color="blackAlpha.700"
                            display="inline"
                          >
                            ({unit === "cm" ? "Centimetres" : "Inches"})
                          </Text>
                        </Text>

                        {/* Secondary unit toggle inline */}
                        <Flex border="1px solid" borderColor="black" mb={1}>
                          <Button
                            type="button"
                            onClick={() => handleUnitChange("cm")}
                            px={3}
                            h="30px"
                            fontSize={{ base: "xs", md: "sm" }}
                            bg={unit === "cm" ? "black" : "white"}
                            color={unit === "cm" ? "white" : "black"}
                            borderRight="1px solid"
                            borderColor="black"
                            fontWeight="normal"
                            borderRadius={0}
                            variant="ghost"
                            _hover={{ bg: unit === "cm" ? "black" : "white" }}
                          >
                            Cm
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleUnitChange("in")}
                            px={3}
                            h="30px"
                            fontWeight="normal"
                            fontSize={{ base: "xs", md: "sm" }}
                            bg={unit === "in" ? "black" : "white"}
                            color={unit === "in" ? "white" : "black"}
                            borderRadius={0}
                            variant="ghost"
                            _hover={{ bg: unit === "in" ? "black" : "white" }}
                          >
                            Inches
                          </Button>
                        </Flex>
                      </Flex>

                      <Input
                        id="height"
                        name="height"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder={unit === "cm" ? "e.g. 165" : "e.g. 65.0"}
                        _placeholder={{
                          color: "blackAlpha.500",
                          fontSize: isMobile ? "xs" : "sm",
                        }}
                        w="full"
                        border="1px solid"
                        borderColor="black"
                        borderRadius="0"
                        h={{ base: "40px", md: "45px" }}
                        px={2}
                        fontSize={isMobile ? "xs" : "sm"}
                        value={heightDisplay}
                        onChange={handleHeightChange}
                        _hover={{ outline: "black" }}
                        _focus={{ boxShadow: "none" }}
                        _focusVisible={{ boxShadow: "none" }}
                        min={0}
                      />
                    </Box>

                    {/* Weight */}
                    <Box mb={3}>
                      <Text as="label" htmlFor="weight" fontSize="sm" fontWeight="medium" mb={2} display="block">
                        Weight
                      </Text>
                      <Input
                        type="number"
                        id="weight"
                        name="weight"
                        placeholder="kg"
                        _placeholder={{
                          color: "blackAlpha.500",
                          fontSize: isMobile ? "xs" : "sm",
                        }}
                        value={formData.weight}
                        min={0}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        borderColor="black"
                        borderRadius="0"
                        h={{ base: "40px", md: "45px" }}
                        fontSize={isMobile ? "xs" : "sm"}
                        px={2}
                        _hover={{ outline: "black" }}
                        _focus={{ boxShadow: "none" }}
                        _focusVisible={{ boxShadow: "none" }}
                      />
                    </Box>

                    {/* Age */}
                    <Box mb={3}>
                      <Text as="label" htmlFor="age" fontSize="sm" fontWeight="medium" mb={2} display="block">
                        Age
                      </Text>
                      <Input
                        type="number"
                        id="age"
                        name="age"
                        placeholder="years"
                        _placeholder={{
                          color: "blackAlpha.500",
                          fontSize: isMobile ? "xs" : "sm",
                        }}
                        min={0}
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        borderColor="black"
                        borderRadius="0"
                        h={{ base: "40px", md: "45px" }}
                        fontSize={isMobile ? "xs" : "sm"}
                        px={2}
                        _hover={{ outline: "black" }}
                        _focus={{ boxShadow: "none" }}
                        _focusVisible={{ boxShadow: "none" }}
                      />
                    </Box>

                    {/* Checkbox */}
                    <Flex align="center" my={5}>
                      <Checkbox
                        id="remember"
                        isChecked={formData.isChecked}
                        onChange={handleCheckboxChange}
                        mr={2}
                        iconColor="white"
                        sx={{
                          ".chakra-checkbox__control": {
                            w: "14px",
                            h: "14px",
                            borderWidth: "1.5px",
                            borderRadius: "0",
                            borderColor: "black",
                            bg: "white",
                            _hover: { bg: "white" },
                            _checked: {
                              bg: "black",
                              borderColor: "black",
                              _hover: { bg: "black", boxShadow: "none" },
                            },
                            _focusVisible: { boxShadow: "none" },
                          },
                          ".chakra-checkbox__icon": {
                            color: "white",
                            w: "12px",
                            h: "12px",
                          },
                        }}
                      />
                      <Text fontSize={isMobile ? "10px" : "sm"} color="black">
                        I confirm these measurements are accurate
                      </Text>
                    </Flex>

                    <Button
                      type="submit"
                      w="full"
                      bg="black"
                      color="white"
                      borderRadius="0"
                      h="45px"
                      fontSize="sm"
                      _hover={{ bg: "gray.900" }}
                      isDisabled={!formData.isChecked}
                    >
                      CONTINUE
                    </Button>
                  </Box>
                ) : (
                  // Step 2: Body shapes
                  <Box
                    as="form"
                    w="90%"
                    maxW="400px"
                    mx="auto"
                    fontSize="12px"
                    mt={6}
                    onSubmit={(e) => {
                      e.preventDefault();
                      setLastSubmittedFormData(formData);
                      handleFinalSummary();
                    }}
                  >
                    {/* Abdominal Shape */}
                    <Box mb={4}>
                      <Text mb={2} fontWeight="semibold">
                        YOUR ABDOMINAL SHAPE
                      </Text>
                      <Image
                        alt="Abdominal"
                        w="25%"
                        p={4}
                        mx="auto"
                        src={
                          formData.abdominalShape === "Flat"
                            ? abdominalShape
                            : formData.abdominalShape === "Medium"
                              ? abdoMedium
                              : abdoBulging
                        }
                      />
                      <Flex>
                        {["Flat", "Medium", "Bulging"].map((shape) => (
                          <Button
                            key={shape}
                            type="button"
                            w="33.333%"
                            borderRadius="0"
                            variant="outline"
                            borderColor="black"
                            fontSize="xs"
                            h="30px"
                            bg={formData.abdominalShape === shape ? "black" : "white"}
                            color={formData.abdominalShape === shape ? "white" : "black"}
                            onClick={() => handleShapeSelect("abdominalShape", shape)}
                            _hover={{
                              bg: formData.abdominalShape === shape ? "black" : "white",
                              color: formData.abdominalShape === shape ? "white" : "black",
                            }}
                            _active={{
                              bg: formData.abdominalShape === shape ? "black" : "transparent",
                            }}
                          >
                            {shape}
                          </Button>
                        ))}
                      </Flex>
                    </Box>

                    {/* Hip Shape */}
                    <Box mb={4}>
                      <Text mb={2} fontWeight="semibold">
                        YOUR HIP SHAPE
                      </Text>
                      <Image
                        alt="Hip"
                        w="150px"
                        p={4}
                        mx="auto"
                        src={
                          formData.hipShape === "Straight"
                            ? hipShape
                            : formData.hipShape === "Average"
                              ? hipMedium
                              : hipWide
                        }
                      />
                      <Flex>
                        {["Straight", "Average", "Wide"].map((shape) => (
                          <Button
                            key={shape}
                            type="button"
                            w="33.333%"
                            borderRadius="0"
                            variant="outline"
                            borderColor="black"
                            fontSize="xs"
                            h="30px"
                            bg={formData.hipShape === shape ? "black" : "white"}
                            color={formData.hipShape === shape ? "white" : "black"}
                            onClick={() => handleShapeSelect("hipShape", shape)}
                            _hover={{
                              bg: formData.hipShape === shape ? "black" : "white",
                              color: formData.hipShape === shape ? "white" : "black",
                            }}
                            _active={{
                              bg: formData.hipShape === shape ? "black" : "transparent",
                            }}
                          >
                            {shape}
                          </Button>
                        ))}
                      </Flex>
                    </Box>

                    {/* Clothing Preference */}
                    <Box mb={4}>
                      <Text as="label" htmlFor="clothingPreference" fontSize="xs" mb={2} display="block" fontWeight="semibold">
                        CLOTHING USAGE PREFERENCE
                      </Text>
                      <Input
                        type="range"
                        min={1}
                        max={3}
                        step={1}
                        value={formData.clothingPreference}
                        id="clothingPreference"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clothingPreference: e.target.value,
                          })
                        }
                        style={{ "--percent": `${percent}%` }}
                        sx={{
                          appearance: "none",
                          w: "100%",
                          h: "6px",
                          borderRadius: "999px",
                          outline: "none",
                          border: "none",
                          backgroundImage:
                            "linear-gradient(black, black), linear-gradient(#e2e8f0, #e2e8f0)",
                          backgroundRepeat: "no-repeat, no-repeat",
                          backgroundSize: "var(--percent) 100%, 100% 100%",
                          backgroundPosition: "left center, left center",
                          "::-webkit-slider-runnable-track": {
                            height: "6px",
                            borderRadius: "999px",
                            background: "transparent",
                          },
                          "::-webkit-slider-thumb": {
                            appearance: "none",
                            width: "16px",
                            height: "16px",
                            marginTop: "-5px",
                            borderRadius: "50%",
                            background: "black",
                            cursor: "pointer",
                            position: "relative",
                            zIndex: 2,
                          },
                          "::-moz-range-track": {
                            height: "6px",
                            borderRadius: "999px",
                            background: "#e2e8f0",
                          },
                          "::-moz-range-progress": {
                            height: "6px",
                            borderRadius: "999px",
                            background: "black",
                          },
                          "::-moz-range-thumb": {
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: "black",
                            border: "none",
                            cursor: "pointer",
                          },
                        }}
                      />

                      <Flex justify="space-between" mt={2} fontSize="xs">
                        <Text>Very Fitted</Text>
                        <Text>Normal</Text>
                        <Text>Very Loose</Text>
                      </Flex>
                    </Box>

                    <Button
                      type="button"
                      w="full"
                      borderRadius="0"
                      variant="outline"
                      borderColor="black"
                      color="black"
                      bg="white"
                      h="30px"
                      fontSize="xs"
                      mb={2}
                      onClick={() => setShowBodyShapeForm(false)}
                      _hover={{ bg: "transparent" }}
                    >
                      Back
                    </Button>

                    <Button type="submit" w="full" bg="black" color="white" borderRadius="0" h="30px" fontSize="xs" _hover={{ bg: "black", color: "white" }}>
                      SUBMIT
                    </Button>
                  </Box>
                )}
              </>
            ) : null}

            {/* Size chart */}
            {showSizeChart && (
              <>
                <Box overflowX="auto">
                  <Table
                    variant="simple"
                    size={isMobile ? "sm" : "md"}
                    border="1px solid"
                    borderColor="blackAlpha.300"
                    textAlign="center"
                    w="full"
                    fontSize={isMobile ? "10px" : "xs"}
                  >
                    <Thead>
                      {guideData?.["size-chart"]?.[apiUnitKey] ? (
                        // Dynamic Headers
                        <Tr>
                          <Th border="1px solid" borderColor="blackAlpha.300" py={2} textAlign="center" fontSize={isMobile ? "10px" : "xs"}>
                            Size
                          </Th>
                          {/* 
                            The API returns an object where keys are row labels (BUST, WAIST, etc)
                            and values are arrays.
                            BUT the "Size" key typically contains the column headers (XS, S, M...)
                            Let's check if there's a specific key for headers or if we assume the first key logic or existing structure.
                            Based on SizeGuidePage, it seems 'Size' key holds the headers.
                        */}
                          {guideData["size-chart"][apiUnitKey]["Size"]?.map((h) => (
                            <Th key={h} border="1px solid" borderColor="blackAlpha.300" py={2} textAlign="center" fontSize={isMobile ? "10px" : "xs"}>
                              {h}
                            </Th>
                          ))}
                        </Tr>
                      ) : (
                        <Tr>
                          {["Size", "XS", "S", "M", "L", "XL", "XXL"].map((h) => (
                            <Th key={h} border="1px solid" borderColor="blackAlpha.300" py={2} textAlign="center" fontSize={isMobile ? "10px" : "xs"}>
                              {h}
                            </Th>
                          ))}
                        </Tr>
                      )}
                    </Thead>
                    <Tbody fontSize={isMobile ? "10px" : "xs"}>
                      {guideData?.["size-chart"]?.[apiUnitKey] ? (
                        // Dynamic Rows
                        Object.keys(guideData["size-chart"][apiUnitKey])
                          .filter((k) => k !== "Size")
                          .map((label) => {
                            const values = guideData["size-chart"][apiUnitKey][label] || [];
                            return (
                              <Tr key={label} fontSize={isMobile ? "10px" : "xs"}>
                                <Td
                                  border="1px solid"
                                  borderColor="blackAlpha.300"
                                  py={2}
                                  textAlign="center"
                                  fontSize={isMobile ? "10px" : "xs"}
                                >
                                  {label}
                                </Td>
                                {values.map((val, idx) => (
                                  <Td key={idx} border="1px solid" borderColor="blackAlpha.300" py={2} textAlign="center" fontSize={isMobile ? "10px" : "xs"} whiteSpace={"nowrap"}>
                                    {val}
                                  </Td>
                                ))}
                              </Tr>
                            );
                          })
                      ) : (
                        // Fallback Static Rows
                        [
                          {
                            label: "BUST",
                            cm: ["81", "86", "91", "97", "102", "107"],
                            inch: ["32", "34", "36", "38", "40", "42"],
                          },
                          {
                            label: "WAIST",
                            cm: ["66", "71", "76", "81", "86", "91"],
                            inch: ["26", "28", "30", "32", "34", "36"],
                          },
                          {
                            label: "HIP",
                            cm: ["89", "94", "99", "104", "109", "114"],
                            inch: ["35", "37", "39", "41", "43", "45"],
                          },
                        ].map((row) => (
                          <Tr key={row.label}>
                            <Td border="1px solid" borderColor="blackAlpha.300" py={2} textAlign="center">
                              {row.label}
                            </Td>
                            {(unit === "cm" ? row.cm : row.inch).map((v, i) => (
                              <Td key={i} border="1px solid" borderColor="blackAlpha.300" py={2} textAlign="center">
                                {v}
                              </Td>
                            ))}
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>

                <Text fontSize={isMobile ? "10px" : "sm"} color="gray.600" mt={2}>
                  *Depending on your body type and dressing habits, the above sizes are for reference only.
                </Text>

                <Text textAlign="center" mt={{ base: 3, md: 5 }} fontSize={isMobile ? "12px" : "18px"}>
                  {guideData?.["measure-yourself"]?.heading || "How to Measure Yourself"}
                </Text>

                <Flex
                  justify="space-between"
                  color="#333"
                  mt={4}
                  direction={isMobile ? "column-reverse" : "row"}
                  fontSize={isMobile ? "10px" : "14px"}
                  align={isMobile ? "center" : "stretch"}
                  gap={isMobile ? 4 : 0}
                >
                  {guideData?.["measure-yourself"]?.steps ? (
                    <UnorderedList listStyleType="none" pl={isMobile ? 0 : 5} pt={6} w={isMobile ? "90%" : "45%"} m={0}>
                      {guideData["measure-yourself"].steps.map((step, index) => (
                        <ListItem key={index} mb={4} lineHeight="1.5">
                          <Text as="strong">
                            <Box
                              as="span"
                              display="inline-flex"
                              alignItems="center"
                              justifyContent="center"
                              w="20px"
                              h="20px"
                              borderRadius="full"
                              bg="black"
                              color="white"
                              fontSize="12px"
                              fontWeight="600"
                              mr={1}
                            >
                              {index + 1}
                            </Box>
                            {step.title || ""}:
                          </Text>{" "}
                          {step.description}
                        </ListItem>
                      ))}
                    </UnorderedList>
                  ) : (
                    // Fallback Links
                    <UnorderedList listStyleType="none" pl={isMobile ? 0 : 5} pt={6} w={isMobile ? "90%" : "45%"} m={0}>
                      <ListItem mb={4} lineHeight="1.5">
                        <Text as="strong">
                          <Box
                            as="span"
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="center"
                            w="20px"
                            h="20px"
                            borderRadius="full"
                            bg="black"
                            color="white"
                            fontSize="12px"
                            fontWeight="600"
                            mr={1}
                          >
                            1
                          </Box>
                          Bust:</Text> Measure under the arms at the fullest point.
                      </ListItem>
                      <ListItem mb={4} lineHeight="1.5">
                        <Text as="strong">
                          <Box
                            as="span"
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="center"
                            w="20px"
                            h="20px"
                            borderRadius="full"
                            bg="black"
                            color="white"
                            fontSize="12px"
                            fontWeight="600"
                            mr={1}
                          >
                            2
                          </Box>
                          Bra:</Text> Measure under the bust area.
                      </ListItem>
                      <ListItem mb={4} lineHeight="1.5">
                        <Text as="strong">
                          <Box
                            as="span"
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="center"
                            w="20px"
                            h="20px"
                            borderRadius="full"
                            bg="black"
                            color="white"
                            fontSize="12px"
                            fontWeight="600"
                            mr={1}
                          >
                            3
                          </Box>
                          Waist:</Text> Measure around the natural waistline.
                      </ListItem>
                      <ListItem mb={4} lineHeight="1.5">
                        <Text as="strong">
                          <Box
                            as="span"
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="center"
                            w="20px"
                            h="20px"
                            borderRadius="full"
                            bg="black"
                            color="white"
                            fontSize="12px"
                            fontWeight="600"
                            mr={1}
                          >
                            4
                          </Box>
                          Hips:</Text> With the feet together, measure the fullest part.
                      </ListItem>
                      <ListItem mb={4} lineHeight="1.5">
                        <Text as="strong">
                          <Box
                            as="span"
                            display="inline-flex"
                            alignItems="center"
                            justifyContent="center"
                            w="20px"
                            h="20px"
                            borderRadius="full"
                            bg="black"
                            color="white"
                            fontSize="12px"
                            fontWeight="600"
                            mr={1}
                          >
                            5
                          </Box>
                          Inside Leg:</Text> In bare feet measure down the inside leg to the floor.
                      </ListItem>
                    </UnorderedList>
                  )}

                  <Box w={isMobile ? "55%" : "auto"} h={isMobile ? "200px" : "300px"} pr={isMobile ? 0 : "50px"}>
                    <Image
                      alt={guideData?.["measure-yourself"]?.image?.alt || "How to Measure"}
                      src={guideData?.["measure-yourself"]?.image?.link || howToMeasure}
                      w="100%"
                      h="100%"
                      objectFit="contain"
                    />
                  </Box>
                </Flex>
              </>
            )}
          </Box>
        )}
      </Box>
    </Flex>
  );
};

SizeChartPopup.propTypes = {
  handleClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    productImages: PropTypes.arrayOf(
      PropTypes.shape({
        image: PropTypes.string,
        type: PropTypes.string,
      })
    ),
  }),
  open: PropTypes.bool.isRequired,
  onComplete: PropTypes.func,
};

export default SizeChartPopup;
