"use client";

import { useState } from "react";
import { useCurrencyStore } from "@/app/store/currency.ts";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Trash2,
} from "lucide-react";

// 실제 환경에서는 API에서 가져와야 하는 환율 데이터
const exchangeRates = {
  USD: 1,
  KRW: 1344.5,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.62,
  CAD: 1.35,
  AUD: 1.52,
  CNY: 7.24,
  CHF: 0.89,
  INR: 83.35,
  SGD: 1.34,
};

// 통화별 심볼 매핑
const currencySymbols = {
  USD: "$",
  KRW: "₩",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CNY: "¥",
  CHF: "CHF",
  INR: "₹",
  SGD: "S$",
};

export default function Page() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const { selectedCurrency, currencies, setCurrency } = useCurrencyStore();
  const [displayCurrency, setDisplayCurrency] = useState<"original" | "converted">("converted");

  // 샘플 포트폴리오 데이터 (구매 통화 정보 포함)
  const tableData = [
    {
      id: 1,
      name: "Apple Inc",
      symbol: "AAPL",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
      quantity: 10,
      purchasePrice: 243.04,
      purchaseCurrency: "USD",
      totalPurchase: 2430.4,
      currentPrice: 2428.4,
      dividend: 10.0,
      dividendYield: 0.41,
      totalProfit: -2.0,
      dailyProfit: -2.0,
    },
    {
      id: 2,
      name: "Tesla, Inc",
      symbol: "TSLA",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Tesla_T_symbol.svg/1920px-Tesla_T_symbol.svg.png",
      quantity: 10,
      purchasePrice: 350.0,
      purchaseCurrency: "EUR",
      totalPurchase: 3500.0,
      currentPrice: 3892.2,
      dividend: 0.0,
      dividendYield: 0,
      totalProfit: 392.2,
      dailyProfit: 197.3,
    },
  ];

  // 통화 변환 함수
  const convertAmount = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ) => {
    const baseAmount = amount / exchangeRates[fromCurrency];
    return baseAmount * exchangeRates[toCurrency];
  };

  // 통화 형식 지정 함수
  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currencySymbols[currency] || "";
    const absAmount = Math.abs(amount);
    const formattedAmount = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absAmount);

    return amount < 0
      ? `-${symbol}${formattedAmount}`
      : `${symbol}${formattedAmount}`;
  };

  // 'converted' 모드일 때 사용될 전체 합 계산
  const totals = tableData.reduce(
    (acc, item) => {
      const convertedPurchase = convertAmount(item.totalPurchase, item.purchaseCurrency, selectedCurrency);
      const convertedCurrent = convertAmount(item.currentPrice, item.purchaseCurrency, selectedCurrency);
      const convertedDividend = convertAmount(item.dividend, item.purchaseCurrency, selectedCurrency);
      const convertedTotalProfit = convertAmount(item.totalProfit, item.purchaseCurrency, selectedCurrency);
      const convertedDailyProfit = convertAmount(item.dailyProfit, item.purchaseCurrency, selectedCurrency);

      return {
        quantity: acc.quantity + item.quantity,
        totalPurchase: acc.totalPurchase + convertedPurchase,
        currentPrice: acc.currentPrice + convertedCurrent,
        dividend: acc.dividend + convertedDividend,
        // 총 구매액 대비 배당금의 합을 구하려면 비율이 아니라 실제 금액을 더한 후에 purchase로 나눠야 합니다.
        dividendYield: 0, // 일단 아래에서 다시 계산
        totalProfit: acc.totalProfit + convertedTotalProfit,
        dailyProfit: acc.dailyProfit + convertedDailyProfit,
      };
    },
    {
      quantity: 0,
      totalPurchase: 0,
      currentPrice: 0,
      dividend: 0,
      dividendYield: 0,
      totalProfit: 0,
      dailyProfit: 0,
    }
  );

  // 평균 배당 수익률 (converted 기준)
  totals.dividendYield = totals.totalPurchase
    ? (totals.dividend / totals.totalPurchase) * 100
    : 0;

  // 드롭다운 토글 함수
  const toggleDropdown = (id: number) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  // 드롭다운 외부 클릭 처리
  const handleClickOutside = () => {
    setOpenDropdownId(null);
  };

  // 드롭다운 메뉴 액션 처리
  const handleMenuAction = (action: "add" | "transfer" | "delete", itemId: number) => {
    switch (action) {
      case "add":
        console.log("거래 추가:", itemId);
        break;
      case "transfer":
        console.log("전송:", itemId);
        break;
      case "delete":
        console.log("삭제:", itemId);
        break;
    }
    setOpenDropdownId(null);
  };

  const handleDelete = () => {
    console.log("Delete items:", selectedItems);
    setSelectedItems([]);
  };

  const handleTransfer = () => {
    console.log("Transfer items:", selectedItems);
    setSelectedItems([]);
  };

  // 표시할 통화 단위 결정(개별 cell)
  const getDisplayAmount = (amount: number, originalCurrency: string) => {
    if (displayCurrency === "original") {
      return formatCurrency(amount, originalCurrency);
    }
    return formatCurrency(
      convertAmount(amount, originalCurrency, selectedCurrency),
      selectedCurrency
    );
  };

  // 만약 original로 표시하는데 서로 다른 통화들이 있으면 합산이 의미가 없으므로 처리
  // 예) [{purchaseCurrency: 'USD'}, {purchaseCurrency: 'EUR'}] => 중복 통화
  const uniqueCurrencies = Array.from(
    new Set(tableData.map((item) => item.purchaseCurrency))
  );
  const hasMultipleCurrencies = uniqueCurrencies.length > 1;

  // original 통화가 단일일 경우에만 footer 합을 제대로 보여주기 위해
  // purchaseCurrency가 모두 동일할 때 해당 통화로 합산
  let originalTotals = {
    totalPurchase: 0,
    currentPrice: 0,
    dividend: 0,
    totalProfit: 0,
    dailyProfit: 0,
  };

  if (!hasMultipleCurrencies && uniqueCurrencies.length === 1) {
    // 모든 항목이 같은 통화로 되어 있을 때만 합산
    const onlyCurrency = uniqueCurrencies[0];
    originalTotals = tableData.reduce(
      (acc, item) => {
        // 같은 통화니까 그대로 숫자 합산
        return {
          totalPurchase: acc.totalPurchase + item.totalPurchase,
          currentPrice: acc.currentPrice + item.currentPrice,
          dividend: acc.dividend + item.dividend,
          totalProfit: acc.totalProfit + item.totalProfit,
          dailyProfit: acc.dailyProfit + item.dailyProfit,
        };
      },
      {
        totalPurchase: 0,
        currentPrice: 0,
        dividend: 0,
        totalProfit: 0,
        dailyProfit: 0,
      }
    );
  }

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
        {/* 투자 추가 버튼 */}
        <button className="bg-white hover:bg-slate-100 text-slate-700 flex justify-center items-center gap-2 px-3.5 py-2 text-sm rounded-[0.5rem] transition-all shadow-xl">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle fill="currentColor" opacity="0.3" cx="12" cy="12" r="10"></circle>
            <path
              d="M11,11 L11,7 C11,6.44771525 11.4477153,6 12,6 C12.5522847,6 13,6.44771525 13,7 L13,11 L17,11 C17.5522847,11 18,11.4477153 18,12 C18,12.5522847 17.5522847,13 17,13 L13,13 L13,17 C13,17.5522847 12.5522847,18 12,18 C11.4477153,18 11,17.5522847 11,17 L11,13 L7,13 C6.44771525,13 6,12.5522847 6,12 C6,11.4477153 6.44771525,11 7,11 L11,11 Z"
              fill="currentColor"
            ></path>
          </svg>
          투자 추가
        </button>
      </div>
      {/* 포트폴리오 테이블 */}
      <div className="p-10 bg-white rounded-2xl shadow-xl">
        <div className="mb-8 bg-slate-100 rounded-[0.5rem] p-1 drop-shadow-sm inline-block">
          <div className="flex space-x-1">
            <button
              onClick={() => setDisplayCurrency("original")}
              className={`px-3 py-2 rounded-[0.5rem] text-sm font-medium transition-all ${
                displayCurrency === "original"
                  ? "bg-white text-slate-900"
                  : "text-slate-400 hover:bg-slate-200"
              }`}
            >
              구매 통화
            </button>
            <button
              onClick={() => setDisplayCurrency("converted")}
              className={`px-3 py-2 rounded-[0.5rem] text-sm font-medium transition-all ${
                displayCurrency === "converted"
                  ? "bg-white text-slate-900"
                  : "text-slate-400 hover:bg-slate-200"
              }`}
            >
              {selectedCurrency}
            </button>
          </div>
        </div>
        {/* 선택 작업 버튼 영역 */}
        <div
          className={`transform transition-all duration-300 ease-out ${
            selectedItems.length > 0
              ? "opacity-100 translate-y-0 mb-8"
              : "opacity-0 -translate-y-4 mb-0 invisible h-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="bg-[#FFE2E5] hover:bg-[#F64E60] text-[#f64e60] hover:text-white flex justify-center items-center gap-2 px-3.5 py-2 text-sm rounded-[0.5rem] transition-all"
            >
              <Trash2 className="w-4 h-4" />
              삭제 ({selectedItems.length})
            </button>
            <button
              onClick={handleTransfer}
              className="bg-[#e1f0ff] hover:bg-[#3699ff] text-[#3699ff] hover:text-white flex justify-center items-center gap-2 px-3.5 py-2 text-sm rounded-[0.5rem] transition-all"
            >
              <ArrowLeftRight className="w-4 h-4" />
              전송 ({selectedItems.length})
            </button>
          </div>
        </div>
        <div className="w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {/* 체크박스 열 */}
                <th className="w-[50px] px-4 pb-3 text-left font-normal align-middle">
                  <input
                    type="checkbox"
                    className="w-4 h-4 appearance-none bg-slate-200 text-white rounded-[0.2rem] relative border-2 border-transparent checked:border-transparent checked:bg-[#3699FE] checked:before:block checked:before:content-['✓'] checked:before:absolute checked:before:inset-0 checked:before:text-white checked:before:flex checked:before:items-center checked:before:justify-center transition-all"
                    checked={selectedItems.length === tableData.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(tableData.map((item) => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th className="pb-3 text-left text-slate-400 font-normal">
                  보유 금융 자산
                </th>
                <th className="pb-3 text-left text-slate-400 font-normal">
                  보유량
                </th>
                <th className="pb-3 text-left text-slate-400 font-normal">
                  구매가
                </th>
                <th className="pb-3 text-left text-slate-400 font-normal">
                  총 구매가
                </th>
                <th className="pb-3 text-left text-slate-400 font-normal">
                  현재가
                </th>
                <th className="pb-3 text-left text-slate-400 font-normal">
                  배당금
                </th>
                <th className="pb-3 text-left text-slate-400 font-normal">
                  배당 수익률
                </th>
                <th className="pb-3 text-left text-slate-400 font-normal">
                  총 수익
                </th>
                <th className="pb-3 text-left text-slate-400 font-normal">
                  일간 수익
                </th>
                <th className="pb-3 text-left text-slate-400 font-normal"></th>
              </tr>
            </thead>
            {/* 테이블 본문 */}
            <tbody>
              {tableData.map((item) => {
                return (
                  <tr key={item.id} className="border-b hover:bg-slate-100">
                    {/* 항목 체크박스 */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 appearance-none bg-slate-200 text-white rounded-[0.2rem] relative border-2 border-transparent checked:border-transparent checked:bg-[#3699FE] checked:before:block checked:before:content-['✓'] checked:before:absolute checked:before:inset-0 checked:before:text-white checked:before:flex checked:before:items-center checked:before:justify-center transition-all"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => {
                          setSelectedItems((prev) =>
                            prev.includes(item.id)
                              ? prev.filter((id) => id !== item.id)
                              : [...prev, item.id]
                          );
                        }}
                      />
                    </td>
                    {/* 자산 정보 */}
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.logo}
                          alt={`${item.name} Logo`}
                          className="w-6 h-6 object-contain"
                        />
                        <div>
                          <p className="font-medium text-slate-700">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500">{item.symbol}</p>
                        </div>
                      </div>
                    </td>
                    {/* 수량 */}
                    <td className="py-3 text-slate-700">{item.quantity}</td>
                    {/* 구매가 */}
                    <td className="py-3 text-slate-700">
                      {getDisplayAmount(item.purchasePrice, item.purchaseCurrency)}
                    </td>
                    {/* 총 구매가 */}
                    <td className="py-3 text-slate-700">
                      {getDisplayAmount(item.totalPurchase, item.purchaseCurrency)}
                    </td>
                    {/* 현재가 (1주당 가격도 표시) */}
                    <td className="py-3">
                      <div>
                        <p className="text-slate-700 font-semibold">
                          {getDisplayAmount(item.currentPrice, item.purchaseCurrency)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {getDisplayAmount(
                            item.currentPrice / item.quantity,
                            item.purchaseCurrency
                          )}
                        </p>
                      </div>
                    </td>
                    {/* 배당금 (1주당 배당금도 표시) */}
                    <td className="py-3">
                      <div>
                        <p className="text-slate-700 font-semibold">
                          {getDisplayAmount(item.dividend, item.purchaseCurrency)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {getDisplayAmount(
                            item.dividend / item.quantity,
                            item.purchaseCurrency
                          )}
                        </p>
                      </div>
                    </td>
                    {/* 배당 수익률 */}
                    <td className="py-3 text-slate-700">
                      {item.dividendYield.toFixed(2)}%
                    </td>
                    {/* 총 수익 */}
                    <td className="py-3">
                      <div>
                        {/* displayCurrency === 'original' 인 경우 단순히 item.totalProfit을 그대로 출력 */}
                        {/* 'converted' 인 경우 convertAmount */}
                        {/* 이미 getDisplayAmount로 묶어도 됨 */}
                        <p
                          className={
                            item.totalProfit >= 0
                              ? "text-[#1bc5bd]"
                              : "text-red-500"
                          }
                        >
                          {item.totalProfit >= 0 ? "+" : ""}
                          {getDisplayAmount(item.totalProfit, item.purchaseCurrency)}
                        </p>
                        <p
                          className={`text-xs ${
                            item.totalProfit >= 0
                              ? "text-[#1bc5bd]"
                              : "text-red-500"
                          }`}
                        >
                          {(
                            (item.totalProfit / item.totalPurchase) *
                            100
                          ).toFixed(2)}
                          %
                        </p>
                      </div>
                    </td>
                    {/* 일간 수익 */}
                    <td className="py-3">
                      <div>
                        <p
                          className={
                            item.dailyProfit >= 0
                              ? "text-[#1bc5bd]"
                              : "text-red-500"
                          }
                        >
                          {item.dailyProfit >= 0 ? "+" : ""}
                          {getDisplayAmount(item.dailyProfit, item.purchaseCurrency)}
                        </p>
                        <p
                          className={`text-xs ${
                            item.dailyProfit >= 0
                              ? "text-[#1bc5bd]"
                              : "text-red-500"
                          }`}
                        >
                          {(
                            (item.dailyProfit / item.totalPurchase) *
                            100
                          ).toFixed(2)}
                          %
                        </p>
                      </div>
                    </td>
                    {/* 더보기 버튼 */}
                    <td className="py-3 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(item.id);
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-gray-400 hover:text-gray-600 rounded-[0.5rem] transition-all"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 256 256"
                        >
                          <g>
                            <path
                              fill="#7E8299"
                              d="M10,128c0,13.4,10.9,24.3,24.3,24.3s24.2-10.9,24.2-24.3s-10.9-24.3-24.3-24.3S10,114.6,10,128z"
                            />
                            <path
                              fill="#7E8299"
                              d="M103.7,128c0,13.4,10.9,24.3,24.3,24.3c13.4,0,24.3-10.9,24.3-24.3s-10.9-24.3-24.3-24.3C114.6,103.7,103.7,114.6,103.7,128L103.7,128z"
                            />
                            <path
                              fill="#7E8299"
                              d="M197.5,128c0,13.4,10.9,24.3,24.3,24.3c13.4,0,24.3-10.9,24.3-24.3c0-13.4-10.9-24.3-24.3-24.3C208.3,103.7,197.5,114.6,197.5,128z"
                            />
                          </g>
                        </svg>
                      </button>
                      {/* 드롭다운 메뉴 */}
                      {openDropdownId === item.id && (
                        <>
                          <div
                            className="fixed inset-0"
                            onClick={handleClickOutside}
                          />
                          <div className="absolute right-0 mt-2 w-32 bg-white rounded-[0.5rem] shadow-xl z-10 py-1">
                            <button
                              onClick={() => handleMenuAction("add", item.id)}
                              className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-100 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" color="#b5b5c3" />
                              거래 추가
                            </button>
                            <button
                              onClick={() => handleMenuAction("transfer", item.id)}
                              className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-slate-100 flex items-center gap-2"
                            >
                              <ArrowLeftRight className="w-4 h-4" color="#b5b5c3" />
                              전송
                            </button>
                            <button
                              onClick={() => handleMenuAction("delete", item.id)}
                              className="w-full text-left px-4 py-2 text-sm font-semibold text-red-600 hover:bg-slate-100 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              삭제
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* 테이블 푸터 (총계) */}
            <tfoot className="border-t">
              <tr>
                <td className="py-3"></td>
                <td className="py-3 font-semibold text-slate-700">Total</td>
                {/* 수량 합계 (통화 상관없이 단순 합) */}
                <td className="py-3 font-semibold text-slate-700">
                  {tableData.reduce((acc, item) => acc + item.quantity, 0)}
                </td>
                {/* 빈 칸 */}
                <td className="py-3 font-semibold text-slate-700"></td>
                {/* 총 구매가 */}
                <td className="py-3 font-semibold text-slate-700">
                  {displayCurrency === "original" ? (
                    hasMultipleCurrencies ? (
                      // 여러 통화가 섞여 있으면 표시 불가
                      <span>---</span>
                    ) : (
                      // 단일 통화면 합산값을 그대로 출력
                      formatCurrency(
                        originalTotals.totalPurchase,
                        uniqueCurrencies[0]
                      )
                    )
                  ) : (
                    // converted인 경우 계산해 놓은 totals에서 값 사용
                    formatCurrency(totals.totalPurchase, selectedCurrency)
                  )}
                </td>
                {/* 현재가 합 */}
                <td className="py-3 font-semibold text-slate-700">
                  {displayCurrency === "original" ? (
                    hasMultipleCurrencies ? (
                      <span>---</span>
                    ) : (
                      formatCurrency(
                        originalTotals.currentPrice,
                        uniqueCurrencies[0]
                      )
                    )
                  ) : (
                    formatCurrency(totals.currentPrice, selectedCurrency)
                  )}
                </td>
                {/* 배당금 합 */}
                <td className="py-3 font-semibold text-slate-700">
                  {displayCurrency === "original" ? (
                    hasMultipleCurrencies ? (
                      <span>---</span>
                    ) : (
                      formatCurrency(originalTotals.dividend, uniqueCurrencies[0])
                    )
                  ) : (
                    formatCurrency(totals.dividend, selectedCurrency)
                  )}
                </td>
                {/* 배당 수익률 (converted 기준) */}
                <td className="py-3 font-semibold text-slate-700">
                  {totals.dividendYield.toFixed(2)}%
                </td>
                {/* 총 수익 */}
                <td className="py-3">
                  <div>
                    {displayCurrency === "original" ? (
                      hasMultipleCurrencies ? (
                        <p className="font-semibold text-slate-500">---</p>
                      ) : (
                        <p
                          className={`font-semibold ${
                            originalTotals.totalProfit >= 0
                              ? "text-[#1bc5bd]"
                              : "text-red-500"
                          }`}
                        >
                          {originalTotals.totalProfit >= 0 ? "+" : ""}
                          {formatCurrency(
                            originalTotals.totalProfit,
                            uniqueCurrencies[0]
                          )}
                        </p>
                      )
                    ) : (
                      <p
                        className={`font-semibold ${
                          totals.totalProfit >= 0
                            ? "text-[#1bc5bd]"
                            : "text-red-500"
                        }`}
                      >
                        {totals.totalProfit >= 0 ? "+" : ""}
                        {formatCurrency(totals.totalProfit, selectedCurrency)}
                      </p>
                    )}

                    {/* 퍼센트 */}
                    <p
                      className={`text-xs ${
                        totals.totalProfit >= 0
                          ? "text-[#1bc5bd]"
                          : "text-red-500"
                      }`}
                    >
                      {totals.totalPurchase
                        ? (
                            (totals.totalProfit / totals.totalPurchase) *
                            100
                          ).toFixed(2)
                        : 0}
                      %
                    </p>
                  </div>
                </td>
                {/* 일간 수익 */}
                <td className="py-3">
                  <div>
                    {displayCurrency === "original" ? (
                      hasMultipleCurrencies ? (
                        <p className="font-semibold text-slate-500">---</p>
                      ) : (
                        <p
                          className={`font-semibold ${
                            originalTotals.dailyProfit >= 0
                              ? "text-[#1bc5bd]"
                              : "text-red-500"
                          }`}
                        >
                          {originalTotals.dailyProfit >= 0 ? "+" : ""}
                          {formatCurrency(
                            originalTotals.dailyProfit,
                            uniqueCurrencies[0]
                          )}
                        </p>
                      )
                    ) : (
                      <p
                        className={`font-semibold ${
                          totals.dailyProfit >= 0
                            ? "text-[#1bc5bd]"
                            : "text-red-500"
                        }`}
                      >
                        {totals.dailyProfit >= 0 ? "+" : ""}
                        {formatCurrency(totals.dailyProfit, selectedCurrency)}
                      </p>
                    )}
                    <p
                      className={`text-xs ${
                        totals.dailyProfit >= 0
                          ? "text-[#1bc5bd]"
                          : "text-red-500"
                      }`}
                    >
                      {totals.totalPurchase
                        ? (
                            (totals.dailyProfit / totals.totalPurchase) *
                            100
                          ).toFixed(2)
                        : 0}
                      %
                    </p>
                  </div>
                </td>
                {/* 마지막 셀(더보기 버튼 영역) 공백 */}
                <td className="py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {/* 페이지네이션 예시 */}
        <div className="flex justify-between mt-6">
          <div className="flex flex-row gap-2">
            <button className="w-8 h-8 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 flex justify-center items-center rounded-md transition-all">
              <ChevronsLeft width={16} height={16} />
            </button>
            <button className="w-8 h-8 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 flex justify-center items-center rounded-md transition-all">
              <ChevronLeft width={16} height={16} />
            </button>
            <button className="w-8 h-8 text-sm text-white bg-[#3699ff] flex justify-center items-center rounded-md">
              1
            </button>
            <button className="w-8 h-8 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 flex justify-center items-center rounded-md transition-all">
              <ChevronRight width={16} height={16} />
            </button>
            <button className="w-8 h-8 text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 flex justify-center items-center rounded-md transition-all">
              <ChevronsRight width={16} height={16} />
            </button>
          </div>
          <div className="flex flex-row items-center gap-4">
            <select className="px-4 py-2 text-slate-700 bg-slate-100 text-sm rounded-md">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-slate-700 text-sm">2개 중 1-2 보기</span>
          </div>
        </div>
      </div>
    </div>
  );
}