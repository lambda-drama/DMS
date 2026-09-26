"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[9070],
	{
		14278: (e, t, s) => {
			s.d(t, { Ke: () => l, Nt: () => r, R6: () => i });
			var a = s(95155),
				n = s(19820);
			function r({ ...e }) {
				return (0, a.jsx)(n.bL, { "data-slot": "collapsible", ...e });
			}
			function i({ ...e }) {
				return (0, a.jsx)(n.R6, { "data-slot": "collapsible-trigger", ...e });
			}
			function l({ ...e }) {
				return (0, a.jsx)(n.Ke, { "data-slot": "collapsible-content", ...e });
			}
		},
		21219: (e, t, s) => {
			s.d(t, {
				$m: () => o,
				Kd: () => A,
				Pg: () => S,
				R: () => w,
				XG: () => g,
				XI: () => O,
				ZO: () => r,
				Zj: () => N,
				aK: () => c,
				bn: () => d,
				gk: () => i,
				ju: () => l,
				jx: () => b,
				mH: () => k,
				mQ: () => h,
				mx: () => v,
				ni: () => p,
				pc: () => m,
				qH: () => j,
				rW: () => _,
				sE: () => u,
				sn: () => y,
				sq: () => f,
				vX: () => x,
				w_: () => T,
			});
			var a = s(49876);
			let n = "dms.api.stock_operations";
			function r(e) {
				let t = e.warehouse_name || e.name;
				return e.workshop_name && e.workshop_name !== t
					? `${e.workshop_name} — ${t}`
					: e.dms_label && e.dms_label !== t
					? `${e.dms_label} — ${t}`
					: t;
			}
			async function i(e) {
				return (0, a.AT)(`/api/method/${n}.get_stock_operation_defaults_api`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function l(e, t, s = 20) {
				return (0, a.AT)(`/api/method/${n}.search_stock_items_for_ui`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, warehouse: t || null, limit: s }),
				});
			}
			async function c(e) {
				return (0, a.AT)(`/api/method/${n}.get_stock_entry_detail`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function o(e) {
				return (0, a.AT)(`/api/method/${n}.get_stock_entries`, {
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
				return (0, a.AT)(`/api/method/${n}.get_stock_reconciliations`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function m(e) {
				return (0, a.AT)(`/api/method/${n}.get_material_request_defaults_api`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function u(e) {
				return (0, a.AT)(`/api/method/${n}.get_material_requests`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function h(e) {
				return (0, a.AT)(`/api/method/${n}.get_item_uoms_for_ui_api`, {
					method: "POST",
					body: JSON.stringify({ item_code: e }),
				});
			}
			async function x(e) {
				return (0, a.AT)(`/api/method/${n}.create_material_request`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function p(e) {
				return (0, a.AT)(`/api/method/${n}.get_pending_material_requests`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function f(e) {
				return (0, a.AT)(`/api/method/${n}.get_material_request_detail`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function g(e, t = !0) {
				return (0, a.AT)(`/api/method/${n}.create_stock_entry_from_material_request`, {
					method: "POST",
					body: JSON.stringify({ name: e, submit: +!!t }),
				});
			}
			async function j(e, t) {
				return (0, a.AT)(
					`/api/method/${n}.create_purchase_receipt_from_material_request`,
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
			async function _(e) {
				return (0, a.AT)(`/api/method/${n}.create_stock_entry`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function y(e) {
				return (0, a.AT)(`/api/method/${n}.create_stock_reconciliation`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function v(e) {
				return (0, a.AT)(`/api/method/${n}.get_purchase_receipt_defaults_api`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function N(e, t = 20) {
				return (0, a.AT)(`/api/method/${n}.search_suppliers_for_ui`, {
					method: "POST",
					body: JSON.stringify({ search: e || null, limit: t }),
				});
			}
			async function b(e) {
				return (0, a.AT)(`/api/method/${n}.create_supplier`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function S(e) {
				return (0, a.AT)(`/api/method/${n}.get_purchase_receipts`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 30,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function w(e) {
				return (0, a.AT)(`/api/method/${n}.get_purchase_receipt_detail`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function A(e) {
				return (0, a.AT)(`/api/method/${n}.create_purchase_receipt`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function O(e, t) {
				let s = await (0, a.AT)(`/api/method/${n}.get_item_price_list_rate_api`, {
					method: "POST",
					body: JSON.stringify({ item_code: e, price_list: t }),
				});
				return Number(s?.rate || 0);
			}
			async function k() {
				return (0, a.AT)(`/api/method/${n}.get_stock_item_create_defaults_api`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function T(e) {
				return (0, a.AT)(`/api/method/${n}.create_stock_item`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
		},
		23511: (e, t, s) => {
			s.d(t, { E: () => r });
			var a = s(95155),
				n = s(91337);
			function r({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "skeleton",
					className: (0, n.cn)("bg-accent animate-pulse rounded-md", e),
					...t,
				});
			}
		},
		38291: (e, t, s) => {
			s.d(t, { E: () => c });
			var a = s(95155);
			s(12115);
			var n = s(42442),
				r = s(18460),
				i = s(91337);
			let l = (0, r.F)(
				"inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
				{
					variants: {
						variant: {
							default:
								"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
							secondary:
								"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
							destructive:
								"border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
							outline:
								"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
						},
					},
					defaultVariants: { variant: "default" },
				}
			);
			function c({ className: e, variant: t, asChild: s = !1, ...r }) {
				let o = s ? n.DX : "span";
				return (0, a.jsx)(o, {
					"data-slot": "badge",
					className: (0, i.cn)(l({ variant: t }), e),
					...r,
				});
			}
		},
		59070: (e, t, s) => {
			s.r(t), s.d(t, { default: () => F });
			var a = s(95155),
				n = s(12115),
				r = s(44855),
				i = s(79984),
				l = s(4474),
				c = s(39658),
				o = s(79792),
				d = s(23511),
				m = s(38291),
				u = s(10086),
				h = s(99916),
				x = s(14278),
				p = s(83786),
				f = s(89123),
				g = s(24642),
				j = s(97810),
				_ = s(92622),
				y = s(66088),
				v = s(45752),
				N = s(6296),
				b = s(91958),
				S = s(41585),
				w = s(67514),
				A = s(91337),
				O = s(66609),
				k = s(21219),
				T = s(49876);
			let $ = "dms.api.inventory";
			async function J(e) {
				return (0, T.AT)(`/api/method/${$}.get_inventory_defaults`, {
					method: "POST",
					body: JSON.stringify({ company: e || null }),
				});
			}
			async function P(e) {
				return (0, T.AT)(`/api/method/${$}.get_stock_balance_report`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			async function C(e) {
				return (0, T.AT)(`/api/method/${$}.get_stock_ledger_report`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			async function Z(e) {
				return (0, T.AT)(`/api/method/${$}.get_inventory_insights_report`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			var E = s(36020);
			function I() {
				let e = new Date();
				return e.setDate(e.getDate() - 30), e.toISOString().split("T")[0];
			}
			function q() {
				return new Date().toISOString().split("T")[0];
			}
			function H(e, t) {
				let s = Number(e || 0).toLocaleString(void 0, { maximumFractionDigits: 2 });
				return t ? `${s} ${t}` : s;
			}
			function F() {
				let [e, t] = (0, n.useState)("insights"),
					[s, T] = (0, n.useState)(!1),
					[$, F] = (0, n.useState)(!1),
					[B, M] = (0, n.useState)(""),
					[D, R] = (0, n.useState)(""),
					[L, W] = (0, n.useState)(""),
					[X, K] = (0, n.useState)(""),
					[V, z] = (0, n.useState)(""),
					[Q, G] = (0, n.useState)(() => new Date().toISOString().split("T")[0]),
					[U, Y] = (0, n.useState)(I),
					[ee, et] = (0, n.useState)(() => new Date().toISOString().split("T")[0]),
					[es, ea] = (0, n.useState)("asc"),
					en = (0, n.useRef)(""),
					er = (0, n.useCallback)(() => {
						G(q()), Y(I()), et(q());
					}, []),
					ei = "balance" === e ? Q !== q() : U !== I() || ee !== q(),
					[el, ec] = (0, n.useState)(null),
					[eo, ed] = (0, n.useState)(null),
					[em, eu] = (0, n.useState)(null),
					[eh, ex] = (0, n.useState)(""),
					ep = eh.trim(),
					{ data: ef = [], isLoading: eg } = (0, r.Ay)(
						["inventory-stock-items", ep, D],
						() => (0, k.ju)(ep || void 0, D || void 0, 30),
						{ dedupingInterval: 3e3 }
					),
					ej = (0, n.useMemo)(
						() =>
							ef.map((e) => {
								let t = (e.item_name || e.item_code || "").trim(),
									s = (e.item_code || "").trim();
								return {
									value: e.item_code,
									label: t || s,
									description: s && s !== t ? s : void 0,
								};
							}),
						[ef]
					),
					e_ = (0, n.useMemo)(() => {
						let e = ef.find((e) => e.item_code === X);
						return e?.item_name ? e.item_name : X || void 0;
					}, [ef, X]),
					{ data: ey, isLoading: ev } = (0, r.Ay)(
						["inventory-defaults", B || ""],
						() => J(B || void 0),
						{ revalidateOnFocus: !1 }
					),
					eN = (0, n.useMemo)(
						() => (ey?.companies ?? []).map((e) => ({ value: e, label: e })),
						[ey?.companies]
					);
				(0, E.Tr)(
					eN.map((e) => ({ name: e.value, company_name: e.label })),
					ev,
					B,
					(e) => M(e.name)
				),
					(0, n.useEffect)(() => {
						ey &&
							(!B && ey.company && M(ey.company),
							ey.as_on_date && G((e) => e || ey.as_on_date));
					}, [ey, B]),
					(0, n.useEffect)(() => {
						B &&
							ey?.default_warehouse &&
							en.current !== B &&
							((en.current = B), R(ey.default_warehouse));
					}, [B, ey?.default_warehouse]);
				let eb = (0, n.useMemo)(() => ey?.warehouses ?? [], [ey?.warehouses]),
					eS = (0, n.useMemo)(
						() => (ey?.item_groups ?? []).map((e) => ({ value: e, label: e })),
						[ey?.item_groups]
					),
					ew = (0, n.useMemo)(
						() => eb.map((e) => ({ value: e.name, label: (0, k.ZO)(e) })),
						[eb]
					),
					eA = (0, n.useCallback)(async () => {
						F(!0);
						try {
							let e = await P({
								company: B || void 0,
								warehouse: D || void 0,
								item_code: X || void 0,
								item_group: L || void 0,
								search: V.trim() || void 0,
								as_on_date: Q,
								sort_order: es,
							});
							ec(e);
						} catch (e) {
							O.o.error(
								e instanceof Error ? e.message : "Failed to load stock balance"
							);
						} finally {
							F(!1);
						}
					}, [B, D, X, L, V, Q, es]),
					eO = (0, n.useCallback)(async () => {
						F(!0);
						try {
							let e = await C({
								company: B || void 0,
								warehouse: D || void 0,
								item_code: X || void 0,
								item_group: L || void 0,
								search: V.trim() || void 0,
								from_date: U,
								to_date: ee,
							});
							ed(e);
						} catch (e) {
							O.o.error(
								e instanceof Error ? e.message : "Failed to load stock ledger"
							);
						} finally {
							F(!1);
						}
					}, [B, D, X, L, V, U, ee]),
					ek = (0, n.useCallback)(async () => {
						F(!0);
						try {
							let e = await Z({
								company: B || void 0,
								warehouse: D || void 0,
								from_date: U,
								to_date: ee,
							});
							eu(e);
						} catch (e) {
							O.o.error(
								e instanceof Error
									? e.message
									: "Failed to load inventory insights"
							);
						} finally {
							F(!1);
						}
					}, [B, D, U, ee]),
					eT = (0, n.useCallback)(
						() => ("balance" === e ? eA() : "ledger" === e ? eO() : ek()),
						[e, eA, eO, ek]
					);
				(0, n.useEffect)(() => {
					ey && !ev && eT();
				}, [e, ey, ev, es]);
				let e$ = el?.summary,
					eJ = [
						{ id: "insights", title: "Insights", icon: f.A },
						{ id: "balance", title: "Stock Balance", icon: g.A },
						{ id: "ledger", title: "Stock Ledger", icon: j.A },
					];
				return (0, a.jsxs)("div", {
					className: "-mt-1 space-y-3 sm:-mt-2",
					children: [
						(0, a.jsx)("div", {
							className: "grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-3/4",
							children: eJ.map((s) => {
								let n = s.icon,
									r = e === s.id;
								return (0, a.jsx)(
									"button",
									{
										type: "button",
										onClick: () => t(s.id),
										className: "w-full text-left",
										children: (0, a.jsx)(i.Zp, {
											className: (0, A.cn)(
												"gap-0 rounded-lg py-0 shadow-none transition-colors hover:border-primary/40",
												r && "border-primary ring-1 ring-primary/20"
											),
											children: (0, a.jsxs)(i.Wu, {
												className: "flex items-center gap-2 px-3 py-1.5",
												children: [
													(0, a.jsx)("div", {
														className:
															"shrink-0 rounded bg-primary/10 p-1",
														children: (0, a.jsx)(n, {
															className: "h-3.5 w-3.5 text-primary",
														}),
													}),
													(0, a.jsx)("p", {
														className:
															"text-sm font-medium leading-none",
														children: s.title,
													}),
												],
											}),
										}),
									},
									s.id
								);
							}),
						}),
						(0, a.jsxs)(x.Nt, {
							open: s,
							onOpenChange: T,
							children: [
								(0, a.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-2",
									children: [
										(0, a.jsx)(x.R6, {
											asChild: !0,
											children: (0, a.jsxs)(l.$, {
												variant: "outline",
												size: "sm",
												className: "gap-2",
												children: [
													(0, a.jsx)(_.A, { className: "h-4 w-4" }),
													"Filters",
													(0, a.jsx)(y.A, {
														className: (0, A.cn)(
															"h-4 w-4 transition-transform",
															s && "rotate-180"
														),
													}),
												],
											}),
										}),
										(0, a.jsxs)("div", {
											className: "flex flex-wrap items-center gap-2",
											children: [
												"balance" === e
													? (0, a.jsxs)(l.$, {
															variant: "outline",
															size: "sm",
															className: "gap-2",
															onClick: () =>
																ea((e) =>
																	"asc" === e ? "desc" : "asc"
																),
															children: [
																(0, a.jsx)(v.A, {
																	className: "h-4 w-4",
																}),
																"Qty ",
																"asc" === es
																	? "↑ Low first"
																	: "↓ High first",
															],
													  })
													: null,
												(0, a.jsxs)(l.$, {
													variant: "outline",
													size: "sm",
													className: "gap-2",
													onClick: eT,
													disabled: $,
													children: [
														$
															? (0, a.jsx)(N.A, {
																	className:
																		"h-4 w-4 animate-spin",
															  })
															: (0, a.jsx)(b.A, {
																	className: "h-4 w-4",
															  }),
														"Refresh",
													],
												}),
											],
										}),
									],
								}),
								(0, a.jsx)(x.Ke, {
									className: "mt-4",
									children: (0, a.jsx)(i.Zp, {
										children: (0, a.jsxs)(i.Wu, {
											className:
												"grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
											children: [
												(0, a.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, a.jsx)(o.J, { children: "Company" }),
														(0, a.jsx)(u.Zi, {
															value: B,
															onValueChange: (e) => {
																M(e), R(""), K("");
															},
															options: eN,
															placeholder: "Company",
															disabled: ev,
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, a.jsx)(o.J, { children: "Warehouse" }),
														(0, a.jsx)(u.Zi, {
															value: D,
															onValueChange: R,
															options: ew,
															placeholder: "All warehouses",
															disabled: ev,
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, a.jsx)(o.J, {
															children: "Item group",
														}),
														(0, a.jsx)(u.Zi, {
															value: L,
															onValueChange: W,
															options: eS,
															placeholder: "All groups",
															disabled: ev,
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, a.jsx)(o.J, {
															children: "Spare part",
														}),
														(0, a.jsx)(u.Zi, {
															value: X,
															onValueChange: K,
															options: ej,
															onSearchChange: ex,
															placeholder:
																"Search by part name or item code…",
															emptyMessage:
																"No spare parts match your search",
															valueLabel: e_,
															isLoading: eg,
														}),
													],
												}),
												(0, a.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, a.jsx)(o.J, { children: "Search" }),
														(0, a.jsx)(c.p, {
															value: V,
															onChange: (e) => z(e.target.value),
															placeholder: "Part name, code, OEM…",
														}),
													],
												}),
												"balance" === e
													? (0, a.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, a.jsx)(o.J, {
																	children: "As on date",
																}),
																(0, a.jsx)(c.p, {
																	type: "date",
																	value: Q,
																	onChange: (e) =>
																		G(e.target.value),
																}),
															],
													  })
													: (0, a.jsxs)(a.Fragment, {
															children: [
																(0, a.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, a.jsx)(o.J, {
																			children: "From date",
																		}),
																		(0, a.jsx)(c.p, {
																			type: "date",
																			value: U,
																			onChange: (e) =>
																				Y(e.target.value),
																		}),
																	],
																}),
																(0, a.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, a.jsx)(o.J, {
																			children: "To date",
																		}),
																		(0, a.jsx)(c.p, {
																			type: "date",
																			value: ee,
																			onChange: (e) =>
																				et(e.target.value),
																		}),
																	],
																}),
															],
													  }),
												(0, a.jsxs)("div", {
													className:
														"flex items-end gap-2 sm:col-span-2 lg:col-span-1",
													children: [
														(0, a.jsx)(l.$, {
															className: "flex-1",
															onClick: eT,
															disabled: $,
															children: "Apply filters",
														}),
														(0, a.jsx)(h.r, {
															onClear: er,
															disabled: !ei,
														}),
													],
												}),
											],
										}),
									}),
								}),
							],
						}),
						"balance" === e
							? (0, a.jsxs)(i.Zp, {
									children: [
										(0, a.jsxs)(i.aR, {
											className:
												"flex flex-row items-center justify-between",
											children: [
												(0, a.jsx)(i.ZB, {
													className: "text-lg",
													children: "Stock balance — spare parts",
												}),
												e$
													? (0, a.jsxs)(m.E, {
															variant: "outline",
															className: "font-normal",
															children: ["As on ", e$.as_on_date],
													  })
													: null,
											],
										}),
										(0, a.jsx)(i.Wu, {
											className: "p-0",
											children:
												ev || ($ && !el)
													? (0, a.jsx)("div", {
															className: "space-y-2 p-6",
															children: [1, 2, 3, 4, 5].map((e) =>
																(0, a.jsx)(
																	d.E,
																	{ className: "h-10 w-full" },
																	e
																)
															),
													  })
													: (0, a.jsx)("div", {
															className: "overflow-x-auto",
															children: (0, a.jsxs)(p.XI, {
																children: [
																	(0, a.jsx)(p.A0, {
																		children: (0, a.jsxs)(
																			p.Hj,
																			{
																				children: [
																					(0, a.jsx)(
																						p.nd,
																						{
																							children:
																								"Item",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							children:
																								"Item group",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							children:
																								"OEM #",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							children:
																								"Default bin",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							className:
																								"text-right",
																							children:
																								"Min level",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							className:
																								"text-right",
																							children:
																								"Qty",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							children:
																								"Status",
																						}
																					),
																				],
																			}
																		),
																	}),
																	(0, a.jsx)(p.BF, {
																		children:
																			0 ===
																			(el?.rows ?? []).length
																				? (0, a.jsx)(
																						p.Hj,
																						{
																							children:
																								(0,
																								a.jsx)(
																									p.nA,
																									{
																										colSpan: 7,
																										className:
																											"py-10 text-center text-muted-foreground",
																										children:
																											"No spare parts found for the selected filters.",
																									}
																								),
																						}
																				  )
																				: el?.rows.map(
																						(e) =>
																							(0,
																							a.jsxs)(
																								p.Hj,
																								{
																									children:
																										[
																											(0,
																											a.jsxs)(
																												p.nA,
																												{
																													children:
																														[
																															(0,
																															a.jsx)(
																																"div",
																																{
																																	className:
																																		"font-medium",
																																	children:
																																		e.item_name,
																																}
																															),
																															(0,
																															a.jsx)(
																																"div",
																																{
																																	className:
																																		"text-xs text-muted-foreground",
																																	children:
																																		e.item_code,
																																}
																															),
																														],
																												}
																											),
																											(0,
																											a.jsx)(
																												p.nA,
																												{
																													children:
																														e.item_group ||
																														"—",
																												}
																											),
																											(0,
																											a.jsx)(
																												p.nA,
																												{
																													children:
																														e.oem_part_number ||
																														"—",
																												}
																											),
																											(0,
																											a.jsx)(
																												p.nA,
																												{
																													className:
																														"font-mono text-sm",
																													children:
																														e.bin_location ||
																														"—",
																												}
																											),
																											(0,
																											a.jsx)(
																												p.nA,
																												{
																													className:
																														"text-right",
																													children:
																														H(
																															e.minimum_stock_level,
																															e.stock_uom
																														),
																												}
																											),
																											(0,
																											a.jsx)(
																												p.nA,
																												{
																													className:
																														"text-right font-medium",
																													children:
																														H(
																															e.qty,
																															e.stock_uom
																														),
																												}
																											),
																											(0,
																											a.jsx)(
																												p.nA,
																												{
																													children:
																														e.is_low_stock
																															? (0,
																															  a.jsxs)(
																																	m.E,
																																	{
																																		variant:
																																			"destructive",
																																		className:
																																			"gap-1",
																																		children:
																																			[
																																				(0,
																																				a.jsx)(
																																					S.A,
																																					{
																																						className:
																																							"h-3 w-3",
																																					}
																																				),
																																				"Low",
																																			],
																																	}
																															  )
																															: (0,
																															  a.jsx)(
																																	m.E,
																																	{
																																		variant:
																																			"secondary",
																																		children:
																																			"OK",
																																	}
																															  ),
																												}
																											),
																										],
																								},
																								e.item_code
																							)
																				  ),
																	}),
																],
															}),
													  }),
										}),
									],
							  })
							: null,
						"ledger" === e
							? (0, a.jsxs)(i.Zp, {
									children: [
										(0, a.jsx)(i.aR, {
											children: (0, a.jsx)(i.ZB, {
												className: "text-lg",
												children: "Stock ledger — spare parts",
											}),
										}),
										(0, a.jsx)(i.Wu, {
											className: "p-0",
											children:
												$ && !eo
													? (0, a.jsx)("div", {
															className: "space-y-2 p-6",
															children: [1, 2, 3, 4, 5].map((e) =>
																(0, a.jsx)(
																	d.E,
																	{ className: "h-10 w-full" },
																	e
																)
															),
													  })
													: (0, a.jsx)("div", {
															className: "overflow-x-auto",
															children: (0, a.jsxs)(p.XI, {
																children: [
																	(0, a.jsx)(p.A0, {
																		children: (0, a.jsxs)(
																			p.Hj,
																			{
																				children: [
																					(0, a.jsx)(
																						p.nd,
																						{
																							children:
																								"Date",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							children:
																								"Item",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							children:
																								"Warehouse",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							className:
																								"text-right",
																							children:
																								"Qty change",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							className:
																								"text-right",
																							children:
																								"Balance",
																						}
																					),
																					(0, a.jsx)(
																						p.nd,
																						{
																							children:
																								"Voucher",
																						}
																					),
																				],
																			}
																		),
																	}),
																	(0, a.jsx)(p.BF, {
																		children:
																			0 ===
																			(eo?.rows ?? []).length
																				? (0, a.jsx)(
																						p.Hj,
																						{
																							children:
																								(0,
																								a.jsx)(
																									p.nA,
																									{
																										colSpan: 6,
																										className:
																											"py-10 text-center text-muted-foreground",
																										children:
																											"No ledger entries in this period.",
																									}
																								),
																						}
																				  )
																				: eo?.rows.map(
																						(e, t) =>
																							(0,
																							a.jsxs)(
																								p.Hj,
																								{
																									children:
																										[
																											(0,
																											a.jsx)(
																												p.nA,
																												{
																													children:
																														e.posting_date,
																												}
																											),
																											(0,
																											a.jsxs)(
																												p.nA,
																												{
																													children:
																														[
																															(0,
																															a.jsx)(
																																"div",
																																{
																																	className:
																																		"font-medium",
																																	children:
																																		e.item_name,
																																}
																															),
																															(0,
																															a.jsx)(
																																"div",
																																{
																																	className:
																																		"text-xs text-muted-foreground",
																																	children:
																																		e.item_code,
																																}
																															),
																														],
																												}
																											),
																											(0,
																											a.jsx)(
																												p.nA,
																												{
																													children:
																														e.warehouse ||
																														"—",
																												}
																											),
																											(0,
																											a.jsxs)(
																												p.nA,
																												{
																													className:
																														(0,
																														A.cn)(
																															"text-right font-medium",
																															e.actual_qty <
																																0
																																? "text-destructive"
																																: "text-chart-3"
																														),
																													children:
																														[
																															e.actual_qty >
																															0
																																? "+"
																																: "",
																															H(
																																e.actual_qty,
																																e.stock_uom
																															),
																														],
																												}
																											),
																											(0,
																											a.jsx)(
																												p.nA,
																												{
																													className:
																														"text-right",
																													children:
																														H(
																															e.qty_after_transaction,
																															e.stock_uom
																														),
																												}
																											),
																											(0,
																											a.jsxs)(
																												p.nA,
																												{
																													children:
																														[
																															(0,
																															a.jsx)(
																																"div",
																																{
																																	className:
																																		"text-sm",
																																	children:
																																		e.voucher_type,
																																}
																															),
																															(0,
																															a.jsx)(
																																"div",
																																{
																																	className:
																																		"text-xs text-muted-foreground",
																																	children:
																																		e.voucher_no,
																																}
																															),
																														],
																												}
																											),
																										],
																								},
																								`${e.voucher_no}-${t}`
																							)
																				  ),
																	}),
																],
															}),
													  }),
										}),
									],
							  })
							: null,
						"insights" === e
							? (0, a.jsxs)("div", {
									className: "grid gap-6 lg:grid-cols-2",
									children: [
										(0, a.jsxs)(i.Zp, {
											children: [
												(0, a.jsxs)(i.aR, {
													className: "flex flex-row items-center gap-2",
													children: [
														(0, a.jsx)(w.A, {
															className: "h-5 w-5 text-destructive",
														}),
														(0, a.jsx)(i.ZB, {
															className: "text-lg",
															children: "Low stock spare parts",
														}),
													],
												}),
												(0, a.jsx)(i.Wu, {
													className: "p-0",
													children: (0, a.jsx)("div", {
														className: "overflow-x-auto",
														children: (0, a.jsxs)(p.XI, {
															children: [
																(0, a.jsx)(p.A0, {
																	children: (0, a.jsxs)(p.Hj, {
																		children: [
																			(0, a.jsx)(p.nd, {
																				children: "Item",
																			}),
																			(0, a.jsx)(p.nd, {
																				children:
																					"Default bin",
																			}),
																			(0, a.jsx)(p.nd, {
																				className:
																					"text-right",
																				children: "Min",
																			}),
																			(0, a.jsx)(p.nd, {
																				className:
																					"text-right",
																				children: "Qty",
																			}),
																		],
																	}),
																}),
																(0, a.jsx)(p.BF, {
																	children:
																		0 ===
																		(em?.low_stock ?? [])
																			.length
																			? (0, a.jsx)(p.Hj, {
																					children: (0,
																					a.jsx)(p.nA, {
																						colSpan: 4,
																						className:
																							"py-8 text-center text-muted-foreground",
																						children:
																							"No low-stock spare parts.",
																					}),
																			  })
																			: em?.low_stock.map(
																					(e) =>
																						(0,
																						a.jsxs)(
																							p.Hj,
																							{
																								children:
																									[
																										(0,
																										a.jsxs)(
																											p.nA,
																											{
																												children:
																													[
																														(0,
																														a.jsx)(
																															"div",
																															{
																																className:
																																	"font-medium",
																																children:
																																	e.item_name,
																															}
																														),
																														(0,
																														a.jsx)(
																															"div",
																															{
																																className:
																																	"text-xs text-muted-foreground",
																																children:
																																	e.item_code,
																															}
																														),
																													],
																											}
																										),
																										(0,
																										a.jsx)(
																											p.nA,
																											{
																												className:
																													"font-mono text-sm",
																												children:
																													e.bin_location ||
																													"—",
																											}
																										),
																										(0,
																										a.jsx)(
																											p.nA,
																											{
																												className:
																													"text-right",
																												children:
																													H(
																														e.minimum_stock_level,
																														e.stock_uom
																													),
																											}
																										),
																										(0,
																										a.jsx)(
																											p.nA,
																											{
																												className:
																													"text-right font-medium text-destructive",
																												children:
																													H(
																														e.qty,
																														e.stock_uom
																													),
																											}
																										),
																									],
																							},
																							e.item_code
																						)
																			  ),
																}),
															],
														}),
													}),
												}),
											],
										}),
										(0, a.jsxs)(i.Zp, {
											children: [
												(0, a.jsxs)(i.aR, {
													className: "flex flex-row items-center gap-2",
													children: [
														(0, a.jsx)(f.A, {
															className: "h-5 w-5 text-primary",
														}),
														(0, a.jsxs)(i.ZB, {
															className: "text-lg",
															children: [
																"Most consumed (",
																U,
																" → ",
																ee,
																")",
															],
														}),
													],
												}),
												(0, a.jsx)(i.Wu, {
													className: "p-0",
													children: (0, a.jsx)("div", {
														className: "overflow-x-auto",
														children: (0, a.jsxs)(p.XI, {
															children: [
																(0, a.jsx)(p.A0, {
																	children: (0, a.jsxs)(p.Hj, {
																		children: [
																			(0, a.jsx)(p.nd, {
																				children: "Item",
																			}),
																			(0, a.jsx)(p.nd, {
																				className:
																					"text-right",
																				children:
																					"Consumed qty",
																			}),
																		],
																	}),
																}),
																(0, a.jsx)(p.BF, {
																	children:
																		0 ===
																		(em?.most_consumed ?? [])
																			.length
																			? (0, a.jsx)(p.Hj, {
																					children: (0,
																					a.jsx)(p.nA, {
																						colSpan: 2,
																						className:
																							"py-8 text-center text-muted-foreground",
																						children:
																							"No consumption in this period.",
																					}),
																			  })
																			: em?.most_consumed.map(
																					(e) =>
																						(0,
																						a.jsxs)(
																							p.Hj,
																							{
																								children:
																									[
																										(0,
																										a.jsxs)(
																											p.nA,
																											{
																												children:
																													[
																														(0,
																														a.jsx)(
																															"div",
																															{
																																className:
																																	"font-medium",
																																children:
																																	e.item_name,
																															}
																														),
																														(0,
																														a.jsx)(
																															"div",
																															{
																																className:
																																	"text-xs text-muted-foreground",
																																children:
																																	e.item_code,
																															}
																														),
																													],
																											}
																										),
																										(0,
																										a.jsx)(
																											p.nA,
																											{
																												className:
																													"text-right font-medium",
																												children:
																													H(
																														e.consumed_qty
																													),
																											}
																										),
																									],
																							},
																							e.item_code
																						)
																			  ),
																}),
															],
														}),
													}),
												}),
											],
										}),
									],
							  })
							: null,
					],
				});
			}
		},
		79984: (e, t, s) => {
			s.d(t, { BT: () => c, Wu: () => o, ZB: () => l, Zp: () => r, aR: () => i });
			var a = s(95155);
			s(12115);
			var n = s(91337);
			function r({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card",
					className: (0, n.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...t,
				});
			}
			function i({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-header",
					className: (0, n.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-title",
					className: (0, n.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "card-content",
					className: (0, n.cn)("px-4", e),
					...t,
				});
			}
		},
		83786: (e, t, s) => {
			s.d(t, {
				A0: () => i,
				BF: () => l,
				Hj: () => c,
				XI: () => r,
				nA: () => d,
				nd: () => o,
			});
			var a = s(95155);
			s(12115);
			var n = s(91337);
			function r({ className: e, ...t }) {
				return (0, a.jsx)("div", {
					"data-slot": "table-container",
					className: "relative w-full overflow-x-auto",
					children: (0, a.jsx)("table", {
						"data-slot": "table",
						className: (0, n.cn)("w-full caption-bottom text-sm", e),
						...t,
					}),
				});
			}
			function i({ className: e, ...t }) {
				return (0, a.jsx)("thead", {
					"data-slot": "table-header",
					className: (0, n.cn)("[&_tr]:border-b", e),
					...t,
				});
			}
			function l({ className: e, ...t }) {
				return (0, a.jsx)("tbody", {
					"data-slot": "table-body",
					className: (0, n.cn)("[&_tr:last-child]:border-0", e),
					...t,
				});
			}
			function c({ className: e, ...t }) {
				return (0, a.jsx)("tr", {
					"data-slot": "table-row",
					className: (0, n.cn)(
						"hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
						e
					),
					...t,
				});
			}
			function o({ className: e, ...t }) {
				return (0, a.jsx)("th", {
					"data-slot": "table-head",
					className: (0, n.cn)(
						"text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
						e
					),
					...t,
				});
			}
			function d({ className: e, ...t }) {
				return (0, a.jsx)("td", {
					"data-slot": "table-cell",
					className: (0, n.cn)(
						"p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
						e
					),
					...t,
				});
			}
		},
		99916: (e, t, s) => {
			s.d(t, { r: () => l });
			var a = s(95155),
				n = s(33210),
				r = s(4474),
				i = s(91337);
			function l({
				onClear: e,
				disabled: t = !1,
				label: s = "Clear filters",
				className: c,
			}) {
				return (0, a.jsxs)(r.$, {
					type: "button",
					variant: "ghost",
					size: "sm",
					onClick: e,
					disabled: t,
					"aria-label": s,
					title: s,
					className: (0, i.cn)("h-9 shrink-0 gap-1.5 text-muted-foreground", c),
					children: [
						(0, a.jsx)(n.A, { "aria-hidden": "true" }),
						(0, a.jsx)("span", { className: "hidden sm:inline", children: s }),
					],
				});
			}
		},
	},
]);
