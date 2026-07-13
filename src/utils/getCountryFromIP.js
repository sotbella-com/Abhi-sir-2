const STORAGE_KEY = "user_geo";

const API_LIST = [
    {
        url: "https://ipapi.co/json/",
        parse: (data) => ({
            ip: data.ip,
            country: data.country_name,
            countryCode: data.country_code,
        }),
    },
    {
        url: "https://ipwho.is/",
        parse: (data) => ({
            ip: data.ip,
            country: data.country,
            countryCode: data.country_code,
        }),
    },
    {
        url: "https://ipinfo.io/json",
        parse: (data) => ({
            ip: data.ip,
            country: COUNTRY_CODE_MAP[data.country] || data.country,
            countryCode: data.country,
        }),
    },
];

export async function getCountryFromIP() {
    try {
        // :white_check_mark: ALWAYS clear old data first
        localStorage.removeItem(STORAGE_KEY);

        // :white_check_mark: Always fetch fresh
        for (const api of API_LIST) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);

                const res = await fetch(api.url, {
                    signal: controller.signal,
                });

                clearTimeout(timeout);

                if (!res.ok) continue;

                const data = await res.json();
                const result = api.parse(data);

                if (result?.country) {
                    // :white_check_mark: Save fresh data
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
                    return result;
                }
            } catch (err) {
                continue;
            }
        }

        return null;
    } catch (err) {
        console.error("Geo lookup failed", err);
        return null;
    }
}

export const COUNTRY_CODE_MAP = {
    IN: "India",
    US: "United States",
    GB: "United Kingdom",
};