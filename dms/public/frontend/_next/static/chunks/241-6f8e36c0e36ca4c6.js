"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[241],
	{
		7915: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("eye", [
				[
					"path",
					{
						d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
						key: "1nclc0",
					},
				],
				["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
			]);
		},
		21219: (e, t, i) => {
			i.d(t, {
				$m: () => c,
				Kd: () => T,
				Pg: () => S,
				R: () => O,
				XG: () => y,
				XI: () => A,
				ZO: () => s,
				Zj: () => j,
				aK: () => l,
				bn: () => d,
				gk: () => n,
				ju: () => o,
				jx: () => N,
				mH: () => w,
				mQ: () => h,
				mx: () => b,
				ni: () => p,
				pc: () => m,
				qH: () => x,
				rW: () => g,
				sE: () => u,
				sn: () => v,
				sq: () => _,
				vX: () => f,
				w_: () => $,
			});
			var r = i(49876);
			let a = "dms.api.stock_operations";
			function s(e) {
				let t = e.warehouse_name || e.name;
				return e.workshop_name && e.workshop_name !== t
					? `${e.workshop_name} — ${t}`
					: e.dms_label && e.dms_label !== t
					? `${e.dms_label} — ${t}`
					: t;
			}
			async function n(e) {
				return (0, r.AT)(`/api/method/${a}.get_stock_operation_defaults_api`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function o(e, t, i = 20) {
				return (0, r.AT)(`/api/method/${a}.search_stock_items_for_ui`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, warehouse: t || null, limit: i }),
				});
			}
			async function l(e) {
				return (0, r.AT)(`/api/method/${a}.get_stock_entry_detail`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function c(e) {
				return (0, r.AT)(`/api/method/${a}.get_stock_entries`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
						posting_from: e?.posting_from || null,
						posting_to: e?.posting_to || null,
					}),
				});
			}
			async function d(e) {
				return (0, r.AT)(`/api/method/${a}.get_stock_reconciliations`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function m(e) {
				return (0, r.AT)(`/api/method/${a}.get_material_request_defaults_api`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function u(e) {
				return (0, r.AT)(`/api/method/${a}.get_material_requests`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function h(e) {
				return (0, r.AT)(`/api/method/${a}.get_item_uoms_for_ui_api`, {
					method: "POST",
					body: JSON.stringify({ item_code: e }),
				});
			}
			async function f(e) {
				return (0, r.AT)(`/api/method/${a}.create_material_request`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function p(e) {
				return (0, r.AT)(`/api/method/${a}.get_pending_material_requests`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function _(e) {
				return (0, r.AT)(`/api/method/${a}.get_material_request_detail`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function y(e, t = !0) {
				return (0, r.AT)(`/api/method/${a}.create_stock_entry_from_material_request`, {
					method: "POST",
					body: JSON.stringify({ name: e, submit: +!!t }),
				});
			}
			async function x(e, t) {
				return (0, r.AT)(
					`/api/method/${a}.create_purchase_receipt_from_material_request`,
					{
						method: "POST",
						body: JSON.stringify({
							name: e,
							supplier: t?.supplier || null,
							submit: +(t?.submit !== !1),
						}),
					}
				);
			}
			async function g(e) {
				return (0, r.AT)(`/api/method/${a}.create_stock_entry`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function v(e) {
				return (0, r.AT)(`/api/method/${a}.create_stock_reconciliation`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function b(e) {
				return (0, r.AT)(`/api/method/${a}.get_purchase_receipt_defaults_api`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function j(e, t = 20) {
				return (0, r.AT)(`/api/method/${a}.search_suppliers_for_ui`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, limit: t }),
				});
			}
			async function N(e) {
				return (0, r.AT)(`/api/method/${a}.create_supplier`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function S(e) {
				return (0, r.AT)(`/api/method/${a}.get_purchase_receipts`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function O(e) {
				return (0, r.AT)(`/api/method/${a}.get_purchase_receipt_detail`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function T(e) {
				return (0, r.AT)(`/api/method/${a}.create_purchase_receipt`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function A(e, t) {
				let i = await (0, r.AT)(`/api/method/${a}.get_item_price_list_rate_api`, {
					method: "POST",
					body: JSON.stringify({ item_code: e, price_list: t }),
				});
				return Number(i?.rate || 0);
			}
			async function w() {
				return (0, r.AT)(`/api/method/${a}.get_stock_item_create_defaults_api`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function $(e) {
				return (0, r.AT)(`/api/method/${a}.create_stock_item`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
		},
		21362: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("chevron-right", [
				["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }],
			]);
		},
		33745: (e, t, i) => {
			i.d(t, { l: () => l });
			var r = i(95155),
				a = i(51914),
				s = i(63360),
				n = i(4474),
				o = i(91337);
			function l({ module: e, label: t, className: i, ...c }) {
				let { canCreate: d } = (0, s.Sk)();
				return d(e)
					? (0, r.jsxs)(n.$, {
							"aria-label": t,
							title: t,
							className: (0, o.cn)(
								"h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2",
								i
							),
							...c,
							children: [
								(0, r.jsx)(a.A, { className: "h-4 w-4 shrink-0" }),
								(0, r.jsx)("span", {
									className: "hidden sm:inline sm:ml-2",
									children: t,
								}),
							],
					  })
					: null;
			}
		},
		41492: (e, t, i) => {
			i.r(t), i.d(t, { default: () => M });
			var r = i(95155),
				a = i(12115),
				s = i(44855),
				n = i(20572),
				o = i(53483),
				l = i(31521),
				c = i(98883),
				d = i(6296),
				m = i(66609),
				u = i(90901),
				h = i(74350),
				f = i(4474),
				p = i(39658),
				_ = i(79792),
				y = i(10086),
				x = i(36020),
				g = i(66348),
				v = i(21219),
				b = i(63360);
			function j({
				open: e,
				onOpenChange: t,
				itemPrice: i,
				createMode: n = !1,
				onUpdated: o,
			}) {
				let { mutate: l } = (0, u.iX)(),
					{ canEditPrice: c } = (0, b.Sk)(),
					[N, S] = (0, a.useState)(!1),
					[O, T] = (0, a.useState)(""),
					{ data: A } = (0, x.hF)(O),
					{ data: w } = (0, s.Ay)(e ? "masters-options" : null, g.kZ),
					[$, P] = (0, a.useState)({
						item_code: "",
						price_list: "",
						price_list_rate: "",
						uom: "",
						valid_from: "",
						valid_upto: "",
					}),
					[k, J] = (0, a.useState)([]),
					[C, M] = (0, a.useState)(!1);
				(0, a.useEffect)(() => {
					if (e) {
						if (n) {
							P({
								item_code: "",
								price_list: w?.default_price_list || "",
								price_list_rate: "",
								uom: "",
								valid_from: "",
								valid_upto: "",
							}),
								T("");
							return;
						}
						i &&
							P({
								item_code: i.item_code || "",
								price_list: i.price_list || "",
								price_list_rate:
									null != i.price_list_rate ? String(i.price_list_rate) : "",
								uom: i.uom || "",
								valid_from: i.valid_from || "",
								valid_upto: i.valid_upto || "",
							});
					}
				}, [e, i, n, w?.default_price_list]),
					(0, a.useEffect)(() => {
						let t = $.item_code;
						if (!e || !t) return void J([]);
						let i = !1;
						return (
							M(!0),
							(0, v.mQ)(t)
								.then((e) => {
									if (i) return;
									let t = (e?.uoms || []).map((e) => ({
										value: e.value,
										label: e.label,
									}));
									J(t);
									let r = e?.stock_uom || "";
									P((e) => {
										let i =
											e.uom && t.some((t) => t.value === e.uom)
												? e.uom
												: r || e.uom;
										return i === e.uom ? e : { ...e, uom: i };
									});
								})
								.catch(() => {
									i || J([]);
								})
								.finally(() => {
									i || M(!1);
								}),
							() => {
								i = !0;
							}
						);
					}, [e, $.item_code]);
				let E = (0, a.useMemo)(() => {
						let e = (A || []).map((e) => ({
							value: e.spare_part_item || e.item_code || e.name,
							label: `${e.item_code || e.spare_part_item || e.name}${
								e.item_name ? ` — ${e.item_name}` : ""
							}`,
						}));
						return (
							$.item_code &&
								!e.some((e) => e.value === $.item_code) &&
								e.unshift({
									value: $.item_code,
									label: i?.item_name
										? `${$.item_code} — ${i.item_name}`
										: $.item_code,
								}),
							e
						);
					}, [A, $.item_code, i?.item_name]),
					z = (0, a.useMemo)(
						() =>
							$.uom && !k.some((e) => e.value === $.uom)
								? [{ value: $.uom, label: $.uom }, ...k]
								: k,
						[k, $.uom]
					),
					R = (0, a.useMemo)(
						() =>
							(w?.price_lists || []).map((e) => ({
								value: e.name,
								label: e.currency ? `${e.name} (${e.currency})` : e.name,
							})),
						[w]
					);
				async function I(e) {
					if ((e.preventDefault(), !$.price_list_rate || 0 >= Number($.price_list_rate)))
						return void m.o.error("Rate must be greater than zero");
					if (n && !c)
						return void m.o.error(
							"You do not have permission to create selling prices"
						);
					S(!0);
					try {
						let e = i?.name || "";
						if (n) {
							if (!$.item_code) {
								m.o.error("Item is required"), S(!1);
								return;
							}
							(e = (
								await g.$K({
									item_code: $.item_code,
									price_list: $.price_list || null,
									price_list_rate: Number($.price_list_rate),
									uom: $.uom || null,
									valid_from: $.valid_from || null,
									valid_upto: $.valid_upto || null,
								})
							).name),
								m.o.success("Item price created");
						} else {
							if (!i?.name) return;
							await g.WA(i.name, {
								price_list_rate: Number($.price_list_rate),
								uom: $.uom || null,
								valid_from: $.valid_from || null,
								valid_upto: $.valid_upto || null,
							}),
								(e = i.name),
								m.o.success("Item price updated");
						}
						await l(
							(e) =>
								Array.isArray(e) &&
								("item-prices-master" === e[0] || "item-price" === e[0]),
							void 0,
							{ revalidate: !0 }
						),
							o?.(e),
							t(!1);
					} catch (e) {
						m.o.error(e instanceof Error ? e.message : "Failed to save item price");
					} finally {
						S(!1);
					}
				}
				return (0, r.jsx)(h.lG, {
					open: e,
					onOpenChange: t,
					children: (0, r.jsx)(h.Cf, {
						className: "sm:max-w-lg",
						children: (0, r.jsxs)("form", {
							onSubmit: I,
							children: [
								(0, r.jsxs)(h.c7, {
									children: [
										(0, r.jsx)(h.L3, {
											children: n ? "New item price" : "Edit item price",
										}),
										(0, r.jsx)(h.rr, {
											children: n
												? "Create a selling price for an item in a vehicle or spare-parts item group."
												: `Update rate for ${i?.item_code || "item"}`,
										}),
									],
								}),
								(0, r.jsxs)("div", {
									className: "grid gap-3 py-4",
									children: [
										n
											? (0, r.jsxs)(r.Fragment, {
													children: [
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(_.J, {
																	children: "Item *",
																}),
																(0, r.jsx)(y.Zi, {
																	options: E,
																	value: $.item_code,
																	onValueChange: (e) =>
																		P((t) => ({
																			...t,
																			item_code: e,
																		})),
																	onSearchChange: T,
																	placeholder:
																		"Search spare parts…",
																}),
															],
														}),
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(_.J, {
																	children: "Price list",
																}),
																(0, r.jsx)(y.Zi, {
																	options: R,
																	value: $.price_list,
																	onValueChange: (e) =>
																		P((t) => ({
																			...t,
																			price_list: e,
																		})),
																	placeholder:
																		"Default selling list",
																}),
															],
														}),
													],
											  })
											: (0, r.jsxs)("div", {
													className:
														"rounded-md border bg-muted/30 px-3 py-2 text-sm",
													children: [
														(0, r.jsx)("div", {
															className: "font-medium",
															children: i?.item_code,
														}),
														(0, r.jsxs)("div", {
															className: "text-muted-foreground",
															children: [
																i?.item_name || "—",
																" \xb7 ",
																i?.price_list || "—",
															],
														}),
													],
											  }),
										(0, r.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(_.J, {
															children: c
																? "Rate *"
																: "Rate (fixed)",
														}),
														(0, r.jsx)(p.p, {
															type: "number",
															min: 0,
															step: "any",
															value: $.price_list_rate,
															onChange: (e) =>
																P((t) => ({
																	...t,
																	price_list_rate:
																		e.target.value,
																})),
															disabled: !c,
															className: c ? void 0 : "bg-muted",
															autoFocus: c,
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(_.J, { children: "UOM" }),
														(0, r.jsx)(y.Zi, {
															options: z,
															value: $.uom,
															onValueChange: (e) =>
																P((t) => ({ ...t, uom: e })),
															placeholder: C
																? "Loading UOMs…"
																: "Select UOM",
															emptyMessage:
																"No UOM configured for this item",
															isLoading: C,
														}),
													],
												}),
											],
										}),
										(0, r.jsxs)("div", {
											className: "grid grid-cols-2 gap-2",
											children: [
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(_.J, {
															children: "Valid from",
														}),
														(0, r.jsx)(p.p, {
															type: "date",
															value: $.valid_from,
															onChange: (e) =>
																P((t) => ({
																	...t,
																	valid_from: e.target.value,
																})),
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(_.J, {
															children: "Valid upto",
														}),
														(0, r.jsx)(p.p, {
															type: "date",
															value: $.valid_upto,
															onChange: (e) =>
																P((t) => ({
																	...t,
																	valid_upto: e.target.value,
																})),
														}),
													],
												}),
											],
										}),
									],
								}),
								(0, r.jsxs)(h.Es, {
									children: [
										(0, r.jsx)(f.$, {
											type: "button",
											variant: "outline",
											onClick: () => t(!1),
											children: "Cancel",
										}),
										(0, r.jsxs)(f.$, {
											type: "submit",
											disabled: N,
											children: [
												N
													? (0, r.jsx)(d.A, {
															className: "mr-2 h-4 w-4 animate-spin",
													  })
													: null,
												"Save",
											],
										}),
									],
								}),
							],
						}),
					}),
				});
			}
			var N = i(33745),
				S = i(93408),
				O = i(79984),
				T = i(43447),
				A = i(83786),
				w = i(61878),
				$ = i(77104),
				P = i(60285),
				k = i(7915),
				J = i(49387);
			function C(e) {
				return null == e || Number.isNaN(Number(e))
					? "—"
					: new Intl.NumberFormat("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
					  }).format(Number(e));
			}
			function M() {
				let [e, t] = (0, l.P)("item-prices", "search", ""),
					[i, m] = (0, a.useState)(e),
					[u, h] = (0, a.useState)(1),
					[_, y] = (0, a.useState)(50),
					[x, v] = (0, a.useState)(null),
					[b, M] = (0, a.useState)(!1),
					[E, z] = (0, a.useState)(null),
					[R, I] = (0, a.useState)(!1);
				(0, a.useEffect)(() => {
					let t = window.setTimeout(() => m(e.trim()), 250);
					return () => window.clearTimeout(t);
				}, [e]),
					(0, a.useEffect)(() => {
						h(1);
					}, [i]);
				let {
						data: U,
						isLoading: Q,
						error: q,
						mutate: F,
					} = (0, s.Ay)(["item-prices-master", i, u, _], () =>
						g.E3({ search: i || void 0, limit: _, offset: (u - 1) * _ })
					),
					{
						data: Z,
						isLoading: L,
						mutate: V,
					} = (0, s.Ay)(x ? ["item-price", x] : null, () => g.Fe(x)),
					H = U?.total || 0,
					{
						items: X,
						loadedCount: B,
						isLoadingMore: D,
						loadMore: W,
					} = (0, o.h)({
						items: U?.data,
						total: H,
						offset: (u - 1) * _,
						resetKey: [i, u, _].join("|"),
						enabled: _ >= o.J,
						fetchMore: async (e, t) =>
							(await g.E3({ search: i || void 0, limit: t, offset: e })).data,
					});
				function K(e) {
					v(e.name), z(e), M(!0);
				}
				return (0, r.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, r.jsxs)("div", {
							className:
								"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
							children: [
								(0, r.jsxs)("div", {
									children: [
										(0, r.jsx)("h1", {
											className: "dms-stat-value text-xl tracking-tight",
											children: "Item Prices",
										}),
										(0, r.jsxs)("p", {
											className: "text-muted-foreground",
											children: [
												"Selling prices for items in vehicle or after-sales spare part groups",
												U?.default_price_list
													? ` \xb7 ${U.default_price_list}`
													: "",
											],
										}),
									],
								}),
								(0, r.jsx)(N.l, {
									module: "item-prices",
									label: "New Item Price",
									onClick: () => I(!0),
								}),
							],
						}),
						(0, r.jsx)(O.Zp, {
							children: (0, r.jsxs)(O.Wu, {
								className: "pt-6 space-y-4",
								children: [
									(0, r.jsxs)("div", {
										className: "relative",
										children: [
											(0, r.jsx)(w.A, {
												className:
													"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
											}),
											(0, r.jsx)(p.p, {
												className: "pl-9",
												placeholder: "Search item code…",
												value: e,
												onChange: (e) => t(e.target.value),
											}),
										],
									}),
									Q
										? (0, r.jsx)("div", {
												className: "flex justify-center py-12",
												children: (0, r.jsx)(d.A, {
													className:
														"h-6 w-6 animate-spin text-muted-foreground",
												}),
										  })
										: q
										? (0, r.jsx)("p", {
												className:
													"text-sm text-destructive py-8 text-center",
												children:
													q.message || "Failed to load item prices",
										  })
										: 0 === X.length
										? (0, r.jsxs)("div", {
												className:
													"flex flex-col items-center py-12 text-muted-foreground",
												children: [
													(0, r.jsx)($.A, {
														className: "h-10 w-10 mb-2 opacity-40",
													}),
													(0, r.jsx)("p", {
														className: "text-sm",
														children: "No item prices found",
													}),
												],
										  })
										: (0, r.jsx)("div", {
												className: "overflow-x-auto rounded-md border",
												children: (0, r.jsxs)(A.XI, {
													children: [
														(0, r.jsx)(A.A0, {
															children: (0, r.jsxs)(A.Hj, {
																children: [
																	(0, r.jsx)(A.nd, {
																		children: "Item",
																	}),
																	(0, r.jsx)(A.nd, {
																		children: "Price list",
																	}),
																	(0, r.jsx)(A.nd, {
																		children: "UOM",
																	}),
																	(0, r.jsx)(A.nd, {
																		className: "text-right",
																		children: "Rate",
																	}),
																	(0, r.jsx)(A.nd, {
																		children: "Valid",
																	}),
																	(0, r.jsx)(A.nd, {
																		className: "w-12",
																	}),
																],
															}),
														}),
														(0, r.jsx)(A.BF, {
															children: X.map((e) =>
																(0, r.jsxs)(
																	A.Hj,
																	{
																		className:
																			"cursor-pointer",
																		onClick: () => v(e.name),
																		children: [
																			(0, r.jsxs)(A.nA, {
																				children: [
																					(0, r.jsx)(
																						"div",
																						{
																							className:
																								"font-medium",
																							children:
																								e.item_code,
																						}
																					),
																					(0, r.jsx)(
																						"div",
																						{
																							className:
																								"text-xs text-muted-foreground",
																							children:
																								e.item_name ||
																								"—",
																						}
																					),
																				],
																			}),
																			(0, r.jsx)(A.nA, {
																				className:
																					"text-sm",
																				children:
																					e.price_list ||
																					"—",
																			}),
																			(0, r.jsx)(A.nA, {
																				className:
																					"text-sm",
																				children:
																					e.uom || "—",
																			}),
																			(0, r.jsxs)(A.nA, {
																				className:
																					"text-right tabular-nums",
																				children: [
																					C(
																						e.price_list_rate
																					),
																					e.currency
																						? (0,
																						  r.jsx)(
																								"span",
																								{
																									className:
																										"text-xs text-muted-foreground ml-1",
																									children:
																										e.currency,
																								}
																						  )
																						: null,
																				],
																			}),
																			(0, r.jsx)(A.nA, {
																				className:
																					"text-xs text-muted-foreground",
																				children:
																					e.valid_from ||
																					e.valid_upto
																						? `${
																								e.valid_from ||
																								"…"
																						  } → ${
																								e.valid_upto ||
																								"…"
																						  }`
																						: "—",
																			}),
																			(0, r.jsx)(A.nA, {
																				onClick: (e) =>
																					e.stopPropagation(),
																				children: (0,
																				r.jsx)(S.m, {
																					doctype:
																						"Item Price",
																					docName:
																						e.name,
																					showPrint: !1,
																					children: (0,
																					r.jsxs)(T.rI, {
																						children: [
																							(0,
																							r.jsx)(
																								T.ty,
																								{
																									asChild:
																										!0,
																									children:
																										(0,
																										r.jsx)(
																											f.$,
																											{
																												variant:
																													"ghost",
																												size: "icon",
																												className:
																													"h-8 w-8 shrink-0",
																												children:
																													(0,
																													r.jsx)(
																														P.A,
																														{
																															className:
																																"h-4 w-4",
																														}
																													),
																											}
																										),
																								}
																							),
																							(0,
																							r.jsxs)(
																								T.SQ,
																								{
																									align: "end",
																									children:
																										[
																											(0,
																											r.jsxs)(
																												T._2,
																												{
																													onClick:
																														() =>
																															v(
																																e.name
																															),
																													children:
																														[
																															(0,
																															r.jsx)(
																																k.A,
																																{
																																	className:
																																		"mr-2 h-4 w-4",
																																}
																															),
																															"View Details",
																														],
																												}
																											),
																											(0,
																											r.jsxs)(
																												T._2,
																												{
																													onClick:
																														() =>
																															K(
																																e
																															),
																													children:
																														[
																															(0,
																															r.jsx)(
																																J.A,
																																{
																																	className:
																																		"mr-2 h-4 w-4",
																																}
																															),
																															"Edit",
																														],
																												}
																											),
																										],
																								}
																							),
																						],
																					}),
																				}),
																			}),
																		],
																	},
																	e.name
																)
															),
														}),
													],
												}),
										  }),
									(0, r.jsx)(n.$, {
										page: u,
										pageSize: _,
										totalItems: H,
										loadedCount: B,
										onPageChange: h,
										onPageSizeChange: y,
										onLoadMore: W,
										isLoadingMore: D,
									}),
								],
							}),
						}),
						(0, r.jsx)(c.BN, {
							open: !!x && !b,
							onOpenChange: (e) => !e && v(null),
							title: Z?.item_code || x || "Item Price",
							subtitle: Z?.price_list || void 0,
							footer: (0, r.jsxs)(f.$, {
								className: "w-full sm:w-auto",
								onClick: () => K(Z || E || { name: x }),
								children: [(0, r.jsx)(J.A, { className: "h-4 w-4 mr-2" }), "Edit"],
							}),
							children: L
								? (0, r.jsx)("div", {
										className: "flex justify-center py-8",
										children: (0, r.jsx)(d.A, {
											className:
												"h-5 w-5 animate-spin text-muted-foreground",
										}),
								  })
								: Z
								? (0, r.jsxs)(c.JH, {
										title: "Price",
										children: [
											(0, r.jsx)(c.Qb, {
												label: "Item",
												value: Z.item_code,
											}),
											(0, r.jsx)(c.Qb, {
												label: "Item name",
												value: Z.item_name,
											}),
											(0, r.jsx)(c.Qb, {
												label: "Price list",
												value: Z.price_list,
											}),
											(0, r.jsx)(c.Qb, {
												label: "Rate",
												value: C(Z.price_list_rate),
											}),
											(0, r.jsx)(c.Qb, {
												label: "Currency",
												value: Z.currency,
											}),
											(0, r.jsx)(c.Qb, { label: "UOM", value: Z.uom }),
											(0, r.jsx)(c.Qb, {
												label: "Valid from",
												value: Z.valid_from,
											}),
											(0, r.jsx)(c.Qb, {
												label: "Valid upto",
												value: Z.valid_upto,
											}),
										],
								  })
								: null,
						}),
						(0, r.jsx)(j, {
							open: b,
							onOpenChange: (e) => {
								M(e), e || z(null);
							},
							itemPrice: E && Z && Z.name === E.name ? Z : E || Z || null,
							onUpdated: () => {
								F(), V();
							},
						}),
						(0, r.jsx)(j, {
							open: R,
							onOpenChange: I,
							itemPrice: null,
							createMode: !0,
							onUpdated: () => {
								F();
							},
						}),
					],
				});
			}
		},
		41641: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("chevron-left", [
				["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }],
			]);
		},
		49387: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("pencil", [
				[
					"path",
					{
						d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
						key: "1a8usu",
					},
				],
				["path", { d: "m15 5 4 4", key: "1mk7zo" }],
			]);
		},
		60285: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("ellipsis", [
				["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
				["circle", { cx: "19", cy: "12", r: "1", key: "1wjl8i" }],
				["circle", { cx: "5", cy: "12", r: "1", key: "1pcz8c" }],
			]);
		},
		60504: (e, t, i) => {
			i.d(t, { A: () => l });
			var r = i(12115),
				a = i(90901),
				s = i(44855),
				n = i(12180);
			let o = n.r
					? (e) => {
							e();
					  }
					: r.startTransition,
				l = (0, a.Ht)(s.Ay, () => (e, t, i = {}) => {
					let { mutate: s } = (0, a.iX)(),
						l = (0, r.useRef)(e),
						c = (0, r.useRef)(t),
						d = (0, r.useRef)(i),
						m = (0, r.useRef)(0),
						[u, h, f] = ((e) => {
							let [, t] = (0, r.useState)({}),
								i = (0, r.useRef)(!1),
								a = (0, r.useRef)(e),
								s = (0, r.useRef)({ data: !1, error: !1, isValidating: !1 }),
								o = (0, r.useCallback)((e) => {
									let r = !1,
										n = a.current;
									for (let t in e)
										Object.prototype.hasOwnProperty.call(e, t) &&
											n[t] !== e[t] &&
											((n[t] = e[t]), s.current[t] && (r = !0));
									r && !i.current && t({});
								}, []);
							return (
								(0, n.u)(
									() => (
										(i.current = !1),
										() => {
											i.current = !0;
										}
									)
								),
								[a, s.current, o]
							);
						})({ data: n.U, error: n.U, isMutating: !1 }),
						p = u.current,
						_ = (0, r.useCallback)(async (e, t) => {
							let [i, r] = (0, n.s)(l.current);
							if (!c.current)
								throw Error("Can’t trigger the mutation: missing fetcher.");
							if (!i) throw Error("Can’t trigger the mutation: missing key.");
							let a = (0, n.m)(
									(0, n.m)({ populateCache: !1, throwOnError: !0 }, d.current),
									t
								),
								u = (0, n.o)();
							(m.current = u), f({ isMutating: !0 });
							try {
								let t = await s(
									i,
									c.current(r, { arg: e }),
									(0, n.m)(a, { throwOnError: !0 })
								);
								return (
									m.current <= u &&
										(o(() => f({ data: t, isMutating: !1, error: void 0 })),
										null == a.onSuccess || a.onSuccess.call(a, t, i, a)),
									t
								);
							} catch (e) {
								if (
									m.current <= u &&
									(o(() => f({ error: e, isMutating: !1 })),
									null == a.onError || a.onError.call(a, e, i, a),
									a.throwOnError)
								)
									throw e;
							}
						}, []),
						y = (0, r.useCallback)(() => {
							(m.current = (0, n.o)()), f({ data: n.U, error: n.U, isMutating: !1 });
						}, []);
					return (
						(0, n.u)(() => {
							(l.current = e), (c.current = t), (d.current = i);
						}),
						{
							trigger: _,
							reset: y,
							get data() {
								return (h.data = !0), p.data;
							},
							get error() {
								return (h.error = !0), p.error;
							},
							get isMutating() {
								return (h.isMutating = !0), p.isMutating;
							},
						}
					);
				});
		},
		61878: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("search", [
				["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
				["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
			]);
		},
		61991: (e, t, i) => {
			i.d(t, { w: () => n });
			var r = i(95155);
			i(12115);
			var a = i(89803),
				s = i(91337);
			function n({ className: e, orientation: t = "horizontal", decorative: i = !0, ...o }) {
				return (0, r.jsx)(a.b, {
					"data-slot": "separator",
					decorative: i,
					orientation: t,
					className: (0, s.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...o,
				});
			}
		},
		66348: (e, t, i) => {
			i.d(t, {
				$K: () => x,
				AQ: () => E,
				CD: () => s,
				E3: () => p,
				Fe: () => _,
				Jm: () => f,
				Lo: () => N,
				MH: () => $,
				PJ: () => v,
				Qn: () => d,
				RJ: () => C,
				TQ: () => k,
				WA: () => y,
				XF: () => P,
				YM: () => l,
				YW: () => m,
				Z6: () => z,
				Z7: () => S,
				_1: () => O,
				_B: () => w,
				aL: () => j,
				b3: () => A,
				kZ: () => J,
				kd: () => M,
				mU: () => T,
				nY: () => c,
				ns: () => R,
				qS: () => b,
				qr: () => u,
				rv: () => g,
				vS: () => n,
				wu: () => o,
				xb: () => h,
			});
			var r = i(49876);
			let a = "dms.api.masters";
			async function s(e) {
				return (0, r.AT)(`/api/method/${a}.list_spare_parts`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						include_discontinued: +!!e?.include_discontinued,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function n(e) {
				return (0, r.AT)(`/api/method/${a}.get_spare_part`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function o(e, t) {
				return (0, r.AT)(`/api/method/${a}.update_spare_part`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function l(e) {
				return (0, r.AT)(`/api/method/${a}.list_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						vehicle_model: e?.vehicle_model || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
						active_filter: e?.active_filter || "active",
					}),
				});
			}
			async function c(e) {
				return (0, r.AT)(`/api/method/${a}.get_vehicle_service_item`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function d(e, t) {
				return (0, r.AT)(`/api/method/${a}.update_vehicle_service_item`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function m(e) {
				return (0, r.AT)(`/api/method/${a}.create_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function u(e, t) {
				return (0, r.AT)(`/api/method/${a}.add_vehicle_service_item_models`, {
					method: "POST",
					body: JSON.stringify({ name: e, vehicle_models: t }),
				});
			}
			async function h(e) {
				return (0, r.AT)(`/api/method/${a}.list_vehicle_service_item_names`, {
					method: "POST",
					body: JSON.stringify({ search: e?.search || null, limit: e?.limit ?? 100 }),
				});
			}
			async function f(e) {
				return (0, r.AT)(`/api/method/${a}.bulk_update_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			async function p(e) {
				return (0, r.AT)(`/api/method/${a}.list_item_prices`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						price_list: e?.price_list || null,
						selling: +(e?.selling !== !1),
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function _(e) {
				return (0, r.AT)(`/api/method/${a}.get_item_price`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function y(e, t) {
				return (0, r.AT)(`/api/method/${a}.update_item_price`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function x(e) {
				return (0, r.AT)(`/api/method/${a}.create_item_price`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function g(e) {
				return (0, r.AT)(`/api/method/${a}.list_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 100,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function v(e) {
				return (0, r.AT)(`/api/method/${a}.create_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function b(e, t) {
				return (0, r.AT)(`/api/method/${a}.update_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function j(e) {
				return (0, r.AT)(`/api/method/${a}.delete_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function N(e) {
				return (0, r.AT)(`/api/method/${a}.list_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 100,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function S(e) {
				return (0, r.AT)(`/api/method/${a}.create_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function O(e, t) {
				return (0, r.AT)(`/api/method/${a}.update_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function T(e) {
				return (0, r.AT)(`/api/method/${a}.delete_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function A(e) {
				return (0, r.AT)(`/api/method/${a}.list_vehicle_models`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						active_filter: e?.active_filter || "active",
						brand: e?.brand || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function w(e) {
				return (0, r.AT)(`/api/method/${a}.get_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function $(e) {
				return (0, r.AT)(`/api/method/${a}.create_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function P(e, t) {
				return (0, r.AT)(`/api/method/${a}.update_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function k(e, t) {
				return (0, r.AT)(`/api/method/${a}.create_vehicle_item_group`, {
					method: "POST",
					body: JSON.stringify({ item_group: e, parent_item_group: t || null }),
				});
			}
			async function J() {
				return (0, r.AT)(`/api/method/${a}.get_masters_options`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function C(e) {
				return (0, r.AT)(`/api/method/${a}.list_vehicle_service_packages`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						active_filter: e?.active_filter || "active",
						vehicle_model: e?.vehicle_model || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function M(e) {
				return (0, r.AT)(`/api/method/${a}.get_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function E(e) {
				return (0, r.AT)(`/api/method/${a}.create_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function z(e, t) {
				return (0, r.AT)(`/api/method/${a}.update_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: t }),
				});
			}
			async function R(e) {
				return (0, r.AT)(`/api/method/${a}.delete_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
		},
		77104: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("banknote", [
				["rect", { width: "20", height: "12", x: "2", y: "6", rx: "2", key: "9lu3g6" }],
				["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }],
				["path", { d: "M6 12h.01M18 12h.01", key: "113zkx" }],
			]);
		},
		79984: (e, t, i) => {
			i.d(t, { BT: () => l, Wu: () => c, ZB: () => o, Zp: () => s, aR: () => n });
			var r = i(95155);
			i(12115);
			var a = i(91337);
			function s({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card",
					className: (0, a.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function n({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-header",
					className: (0, a.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-title",
					className: (0, a.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-description",
					className: (0, a.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "card-content",
					className: (0, a.cn)("px-4", e),
					...t,
				});
			}
		},
		81262: (e, t, i) => {
			i.d(t, { A: () => r });
			let r = (0, i(90425).A)("printer", [
				[
					"path",
					{
						d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
						key: "143wyd",
					},
				],
				["path", { d: "M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6", key: "1itne7" }],
				["rect", { x: "6", y: "14", width: "12", height: "8", rx: "1", key: "1ue0tg" }],
			]);
		},
		89803: (e, t, i) => {
			i.d(t, { b: () => d });
			var r = i(12115);
			i(47650);
			var a = i(42442),
				s = i(95155),
				n = [
					"a",
					"button",
					"div",
					"form",
					"h2",
					"h3",
					"img",
					"input",
					"label",
					"li",
					"nav",
					"ol",
					"p",
					"select",
					"span",
					"svg",
					"ul",
				].reduce((e, t) => {
					let i = (0, a.TL)(`Primitive.${t}`),
						n = r.forwardRef((e, r) => {
							let { asChild: a, ...n } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, s.jsx)(a ? i : t, { ...n, ref: r })
							);
						});
					return (n.displayName = `Primitive.${t}`), { ...e, [t]: n };
				}, {}),
				o = "horizontal",
				l = ["horizontal", "vertical"],
				c = r.forwardRef((e, t) => {
					var i;
					let { decorative: r, orientation: a = o, ...c } = e,
						d = ((i = a), l.includes(i)) ? a : o;
					return (0, s.jsx)(n.div, {
						"data-orientation": d,
						...(r
							? { role: "none" }
							: {
									"aria-orientation": "vertical" === d ? d : void 0,
									role: "separator",
							  }),
						...c,
						ref: t,
					});
				});
			c.displayName = "Separator";
			var d = c;
		},
		98883: (e, t, i) => {
			i.d(t, { Qb: () => g, JH: () => x, BN: () => y });
			var r = i(95155);
			i(12115);
			var a = i(29483),
				s = i(33210),
				n = i(91337);
			function o({ ...e }) {
				return (0, r.jsx)(a.bL, { "data-slot": "sheet", ...e });
			}
			function l({ ...e }) {
				return (0, r.jsx)(a.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function c({ className: e, ...t }) {
				return (0, r.jsx)(a.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, n.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...t,
				});
			}
			function d({ className: e, children: t, side: i = "right", ...o }) {
				return (0, r.jsxs)(l, {
					children: [
						(0, r.jsx)(c, {}),
						(0, r.jsxs)(a.UC, {
							"data-slot": "sheet-content",
							className: (0, n.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
								"right" === i &&
									"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
								"left" === i &&
									"data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
								"top" === i &&
									"data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
								"bottom" === i &&
									"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
								e
							),
							...o,
							children: [
								t,
								(0, r.jsxs)(a.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, r.jsx)(s.A, { className: "size-4" }),
										(0, r.jsx)("span", {
											className: "sr-only",
											children: "Close",
										}),
									],
								}),
							],
						}),
					],
				});
			}
			function m({ className: e, ...t }) {
				return (0, r.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, n.cn)("flex flex-col gap-1.5 p-4", e),
					...t,
				});
			}
			function u({ className: e, ...t }) {
				return (0, r.jsx)(a.hE, {
					"data-slot": "sheet-title",
					className: (0, n.cn)("text-foreground font-semibold", e),
					...t,
				});
			}
			function h({ className: e, ...t }) {
				return (0, r.jsx)(a.VY, {
					"data-slot": "sheet-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			var f = i(38291),
				p = i(61991),
				_ = i(6296);
			function y({
				open: e,
				onOpenChange: t,
				title: i,
				subtitle: a,
				badge: s,
				isLoading: l,
				onOpenInDesk: c,
				footer: x,
				contentScroll: g = "outer",
				children: v,
			}) {
				return (0, r.jsx)(o, {
					open: e,
					onOpenChange: t,
					children: (0, r.jsxs)(d, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, r.jsx)(m, {
								className: "shrink-0 bg-dms-green-light px-4 pt-4 pb-3",
								children: (0, r.jsx)("div", {
									className:
										"flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between",
									children: (0, r.jsxs)("div", {
										className: "min-w-0",
										children: [
											(0, r.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, r.jsx)(u, {
														className: "text-lg",
														children: i,
													}),
													s &&
														(0, r.jsx)(f.E, {
															variant: s.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: s.label,
														}),
												],
											}),
											a && (0, r.jsx)(h, { className: "mt-1", children: a }),
										],
									}),
								}),
							}),
							(0, r.jsx)(p.w, { className: "bg-(--dms-green)/20" }),
							l
								? (0, r.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, r.jsx)(_.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, r.jsxs)(r.Fragment, {
										children: [
											(0, r.jsx)("div", {
												className: (0, n.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === g
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: v,
											}),
											x &&
												(0, r.jsx)("div", {
													className:
														"shrink-0 border-t bg-background px-4 py-3",
													children: x,
												}),
										],
								  }),
						],
					}),
				});
			}
			function x({ title: e, children: t, className: i }) {
				return (0, r.jsxs)("div", {
					className: (0, n.cn)("space-y-2", i),
					children: [
						(0, r.jsxs)("h3", {
							className:
								"text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2",
							children: [
								(0, r.jsx)("span", {
									className: "w-1 h-4 rounded-full bg-dms-green",
								}),
								e,
							],
						}),
						(0, r.jsx)("div", {
							className:
								"rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3",
							children: t,
						}),
					],
				});
			}
			function g({ label: e, value: t, className: i }) {
				return (0, r.jsxs)("div", {
					className: (0, n.cn)(
						"flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
						i
					),
					children: [
						(0, r.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: e,
						}),
						(0, r.jsx)("span", {
							className: "text-sm font-medium sm:text-right",
							children: t || "—",
						}),
					],
				});
			}
		},
	},
]);
