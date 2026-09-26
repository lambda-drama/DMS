"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[8355],
	{
		15306: (e, a, t) => {
			t.d(a, { Xi: () => o, av: () => c, j7: () => l, tU: () => r });
			var s = t(95155);
			t(12115);
			var n = t(57518),
				i = t(91337);
			function r({ className: e, ...a }) {
				return (0, s.jsx)(n.bL, {
					"data-slot": "tabs",
					className: (0, i.cn)("flex flex-col gap-2", e),
					...a,
				});
			}
			function l({ className: e, ...a }) {
				return (0, s.jsx)(n.B8, {
					"data-slot": "tabs-list",
					className: (0, i.cn)(
						"bg-muted text-muted-foreground inline-flex h-9 w-fit max-w-full items-center justify-start overflow-x-auto rounded-lg p-[3px]",
						e
					),
					...a,
				});
			}
			function o({ className: e, ...a }) {
				return (0, s.jsx)(n.l9, {
					"data-slot": "tabs-trigger",
					className: (0, i.cn)(
						"data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...a,
				});
			}
			function c({ className: e, ...a }) {
				return (0, s.jsx)(n.UC, {
					"data-slot": "tabs-content",
					className: (0, i.cn)("outline-none data-[state=inactive]:hidden", e),
					...a,
				});
			}
		},
		33745: (e, a, t) => {
			t.d(a, { l: () => o });
			var s = t(95155),
				n = t(51914),
				i = t(63360),
				r = t(4474),
				l = t(91337);
			function o({ module: e, label: a, className: t, ...c }) {
				let { canCreate: d } = (0, i.Sk)();
				return d(e)
					? (0, s.jsxs)(r.$, {
							"aria-label": a,
							title: a,
							className: (0, l.cn)(
								"h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2",
								t
							),
							...c,
							children: [
								(0, s.jsx)(n.A, { className: "h-4 w-4 shrink-0" }),
								(0, s.jsx)("span", {
									className: "hidden sm:inline sm:ml-2",
									children: a,
								}),
							],
					  })
					: null;
			}
		},
		61991: (e, a, t) => {
			t.d(a, { w: () => r });
			var s = t(95155);
			t(12115);
			var n = t(89803),
				i = t(91337);
			function r({ className: e, orientation: a = "horizontal", decorative: t = !0, ...l }) {
				return (0, s.jsx)(n.b, {
					"data-slot": "separator",
					decorative: t,
					orientation: a,
					className: (0, i.cn)(
						"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
						e
					),
					...l,
				});
			}
		},
		66348: (e, a, t) => {
			t.d(a, {
				$K: () => v,
				AQ: () => E,
				CD: () => i,
				E3: () => x,
				Fe: () => f,
				Jm: () => p,
				Lo: () => y,
				MH: () => T,
				PJ: () => _,
				Qn: () => d,
				RJ: () => P,
				TQ: () => J,
				WA: () => g,
				XF: () => C,
				YM: () => o,
				YW: () => m,
				Z6: () => L,
				Z7: () => k,
				_1: () => S,
				_B: () => O,
				aL: () => N,
				b3: () => A,
				kZ: () => $,
				kd: () => F,
				mU: () => w,
				nY: () => c,
				ns: () => q,
				qS: () => j,
				qr: () => u,
				rv: () => b,
				vS: () => r,
				wu: () => l,
				xb: () => h,
			});
			var s = t(49876);
			let n = "dms.api.masters";
			async function i(e) {
				return (0, s.AT)(`/api/method/${n}.list_spare_parts`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						include_discontinued: +!!e?.include_discontinued,
						limit: e?.limit ?? 50,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function r(e) {
				return (0, s.AT)(`/api/method/${n}.get_spare_part`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function l(e, a) {
				return (0, s.AT)(`/api/method/${n}.update_spare_part`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: a }),
				});
			}
			async function o(e) {
				return (0, s.AT)(`/api/method/${n}.list_vehicle_service_items`, {
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
				return (0, s.AT)(`/api/method/${n}.get_vehicle_service_item`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function d(e, a) {
				return (0, s.AT)(`/api/method/${n}.update_vehicle_service_item`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: a }),
				});
			}
			async function m(e) {
				return (0, s.AT)(`/api/method/${n}.create_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function u(e, a) {
				return (0, s.AT)(`/api/method/${n}.add_vehicle_service_item_models`, {
					method: "POST",
					body: JSON.stringify({ name: e, vehicle_models: a }),
				});
			}
			async function h(e) {
				return (0, s.AT)(`/api/method/${n}.list_vehicle_service_item_names`, {
					method: "POST",
					body: JSON.stringify({ search: e?.search || null, limit: e?.limit ?? 100 }),
				});
			}
			async function p(e) {
				return (0, s.AT)(`/api/method/${n}.bulk_update_vehicle_service_items`, {
					method: "POST",
					body: JSON.stringify(e),
				});
			}
			async function x(e) {
				return (0, s.AT)(`/api/method/${n}.list_item_prices`, {
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
			async function f(e) {
				return (0, s.AT)(`/api/method/${n}.get_item_price`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function g(e, a) {
				return (0, s.AT)(`/api/method/${n}.update_item_price`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: a }),
				});
			}
			async function v(e) {
				return (0, s.AT)(`/api/method/${n}.create_item_price`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function b(e) {
				return (0, s.AT)(`/api/method/${n}.list_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 100,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function _(e) {
				return (0, s.AT)(`/api/method/${n}.create_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function j(e, a) {
				return (0, s.AT)(`/api/method/${n}.update_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: a }),
				});
			}
			async function N(e) {
				return (0, s.AT)(`/api/method/${n}.delete_job_card_terms`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function y(e) {
				return (0, s.AT)(`/api/method/${n}.list_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({
						search: e?.search || null,
						limit: e?.limit ?? 100,
						offset: e?.offset ?? 0,
					}),
				});
			}
			async function k(e) {
				return (0, s.AT)(`/api/method/${n}.create_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function S(e, a) {
				return (0, s.AT)(`/api/method/${n}.update_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: a }),
				});
			}
			async function w(e) {
				return (0, s.AT)(`/api/method/${n}.delete_sales_invoice_tc`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function A(e) {
				return (0, s.AT)(`/api/method/${n}.list_vehicle_models`, {
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
			async function O(e) {
				return (0, s.AT)(`/api/method/${n}.get_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function T(e) {
				return (0, s.AT)(`/api/method/${n}.create_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function C(e, a) {
				return (0, s.AT)(`/api/method/${n}.update_vehicle_model`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: a }),
				});
			}
			async function J(e, a) {
				return (0, s.AT)(`/api/method/${n}.create_vehicle_item_group`, {
					method: "POST",
					body: JSON.stringify({ item_group: e, parent_item_group: a || null }),
				});
			}
			async function $() {
				return (0, s.AT)(`/api/method/${n}.get_masters_options`, {
					method: "POST",
					body: JSON.stringify({}),
				});
			}
			async function P(e) {
				return (0, s.AT)(`/api/method/${n}.list_vehicle_service_packages`, {
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
			async function F(e) {
				return (0, s.AT)(`/api/method/${n}.get_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function E(e) {
				return (0, s.AT)(`/api/method/${n}.create_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function L(e, a) {
				return (0, s.AT)(`/api/method/${n}.update_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e, data: a }),
				});
			}
			async function q(e) {
				return (0, s.AT)(`/api/method/${n}.delete_vehicle_service_package`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
		},
		79984: (e, a, t) => {
			t.d(a, { BT: () => o, Wu: () => c, ZB: () => l, Zp: () => i, aR: () => r });
			var s = t(95155);
			t(12115);
			var n = t(91337);
			function i({ className: e, ...a }) {
				return (0, s.jsx)("div", {
					"data-slot": "card",
					className: (0, n.cn)(
						"bg-card text-card-foreground flex flex-col gap-2 rounded-[1.15rem] border py-3 shadow-[0_4px_20px_rgba(15,61,94,0.05)]",
						e
					),
					...a,
				});
			}
			function r({ className: e, ...a }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-header",
					className: (0, n.cn)(
						"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-3",
						e
					),
					...a,
				});
			}
			function l({ className: e, ...a }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-title",
					className: (0, n.cn)(
						"leading-none font-serif-display font-semibold tracking-tight",
						e
					),
					...a,
				});
			}
			function o({ className: e, ...a }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-description",
					className: (0, n.cn)("text-muted-foreground text-sm", e),
					...a,
				});
			}
			function c({ className: e, ...a }) {
				return (0, s.jsx)("div", {
					"data-slot": "card-content",
					className: (0, n.cn)("px-4", e),
					...a,
				});
			}
		},
		84437: (e, a, t) => {
			t.d(a, { S: () => l });
			var s = t(95155);
			t(12115);
			var n = t(47279),
				i = t(94514),
				r = t(91337);
			function l({ className: e, ...a }) {
				return (0, s.jsx)(n.bL, {
					"data-slot": "checkbox",
					className: (0, r.cn)(
						"peer border-input dark:bg-input/30 data-[state=checked]:bg-dms-green data-[state=checked]:text-white dark:data-[state=checked]:bg-dms-green data-[state=checked]:border-dms-green focus-visible:border-dms-green focus-visible:ring-(--dms-green)/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 cursor-pointer rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
						e
					),
					...a,
					children: (0, s.jsx)(n.C1, {
						"data-slot": "checkbox-indicator",
						className: "flex items-center justify-center text-current transition-none",
						children: (0, s.jsx)(i.A, { className: "size-3.5" }),
					}),
				});
			}
		},
		88355: (e, a, t) => {
			t.r(a), t.d(a, { default: () => X });
			var s = t(95155),
				n = t(12115),
				i = t(44855),
				r = t(66609),
				l = t(20572),
				o = t(53483),
				c = t(31521),
				d = t(98883),
				m = t(6296),
				u = t(33210),
				h = t(68459),
				p = t(51914),
				x = t(74350),
				f = t(4474),
				g = t(39658),
				v = t(79792),
				b = t(84437),
				_ = t(10086),
				j = t(36020),
				N = t(66348);
			let y = 0;
			function k(e) {
				return (y += 1), `${e}-${y}`;
			}
			function S() {
				return {
					key: k("labour"),
					labor_operation: "",
					operation_name: "",
					standard_hours: 0,
					quantity: 1,
					total_hours: 0,
					notes: "",
				};
			}
			function w() {
				return {
					key: k("part"),
					part_item: "",
					part_name: "",
					quantity: 1,
					unit_price: 0,
				};
			}
			function A(e) {
				let a = Number.parseFloat(e);
				return Number.isFinite(a) ? a : 0;
			}
			function O(e) {
				return (e.model_code || "").trim() || e.model_name || e.name;
			}
			function T({ open: e, onOpenChange: a, packageName: t, onSaved: i }) {
				let l = !!t,
					[o, c] = (0, n.useState)(!1),
					[d, y] = (0, n.useState)(!1),
					[C, J] = (0, n.useState)(""),
					[$, P] = (0, n.useState)(""),
					[F, E] = (0, n.useState)(""),
					[L, q] = (0, n.useState)("10000"),
					[Q, D] = (0, n.useState)("6"),
					[z, I] = (0, n.useState)(""),
					[B, Z] = (0, n.useState)(""),
					[H, V] = (0, n.useState)(""),
					[M, U] = (0, n.useState)(!0),
					[R, X] = (0, n.useState)([]),
					[K, W] = (0, n.useState)([S()]),
					[Y, G] = (0, n.useState)([w()]),
					[ee, ea] = (0, n.useState)(""),
					[et, es] = (0, n.useState)(""),
					[en, ei] = (0, n.useState)(""),
					{ data: er, isLoading: el } = (0, j.iR)(ee),
					{ data: eo, isLoading: ec } = (0, j.Sg)(et),
					{ data: ed, isLoading: em } = (0, j.hF)(en);
				(0, n.useEffect)(() => {
					if (!e) return;
					if (!t)
						return void (J(""),
						P(""),
						E(""),
						q("10000"),
						D("6"),
						I(""),
						Z(""),
						V(""),
						U(!0),
						X([]),
						W([S()]),
						G([w()]),
						ea(""),
						es(""),
						ei(""));
					let a = !1;
					return (
						c(!0),
						N.kd(t)
							.then((e) => {
								if (a) return;
								J(e.package_name || e.name),
									P(e.package_id || ""),
									E(e.description || ""),
									q(null != e.interval_km ? String(e.interval_km) : ""),
									D(null != e.interval_months ? String(e.interval_months) : ""),
									I(
										e.labour_discount_amount
											? String(e.labour_discount_amount)
											: ""
									),
									Z(e.before_discount ? String(e.before_discount) : ""),
									V(e.after_discount ? String(e.after_discount) : ""),
									U(null == e.is_active || 1 === Number(e.is_active));
								let t = [];
								for (let a of e.applicable_vehicle_models || []) {
									let e = "string" == typeof a ? a : a?.vehicle_model;
									e && t.push({ name: e, label: e });
								}
								X(t);
								let s = (e.labor_operations || []).map((e) => ({
									key: k("labour"),
									labor_operation: e.labor_operation || "",
									operation_name: e.operation_name || "",
									standard_hours: Number(e.standard_hours) || 0,
									quantity: Number(e.quantity) || 1,
									total_hours: Number(e.total_hours) || 0,
									notes: e.notes || "",
								}));
								W(s.length ? s : [S()]);
								let n = (e.parts_included || []).map((e) => ({
									key: k("part"),
									part_item: e.part_item || "",
									part_name: e.part_name || "",
									quantity: Number(e.quantity) || 1,
									unit_price: Number(e.unit_price) || 0,
								}));
								G(n.length ? n : [w()]);
							})
							.catch((e) => {
								a ||
									r.o.error(
										e instanceof Error
											? e.message
											: "Failed to load service package"
									);
							})
							.finally(() => {
								a || c(!1);
							}),
						() => {
							a = !0;
						}
					);
				}, [e, t]);
				let eu = (er || [])
						.filter((e) => !R.some((a) => a.name === e.name))
						.map((e) => ({
							value: e.name,
							label: O(e),
							description:
								[e.model_name, e.variant].filter(Boolean).join(" ") || void 0,
						})),
					eh = (eo || []).map((e) => ({
						value: e.name,
						label: e.custom_service_code || e.service_item || e.name,
						description: e.service_item || void 0,
					})),
					ep = (ed || []).map((e) => ({
						value: e.name,
						label: e.item_name || e.item_code || e.name,
						description:
							[e.item_code, e.bin_location].filter(Boolean).join(" \xb7 ") || void 0,
					}));
				function ex(e, a) {
					W((t) => t.map((t) => (t.key === e ? { ...t, ...a } : t)));
				}
				function ef(e, a) {
					G((t) => t.map((t) => (t.key === e ? { ...t, ...a } : t)));
				}
				let eg = K.reduce((e, a) => e + (Number(a.total_hours) || 0), 0),
					ev = Y.reduce(
						(e, a) => e + (Number(a.quantity) || 0) * (Number(a.unit_price) || 0),
						0
					);
				async function eb() {
					if (!C.trim()) return void r.o.error("Package Name is required");
					let e = {
						package_name: C.trim(),
						package_id: $.trim() || null,
						description: F.trim(),
						vehicle_model: R[0]?.name || null,
						applicable_vehicle_models: R.map((e) => ({ vehicle_model: e.name })),
						interval_km: A(L),
						interval_months: A(Q),
						labour_discount_amount: A(z),
						before_discount: A(B),
						after_discount: A(H),
						total_amount: A(H) || A(B),
						is_active: +!!M,
						labor_operations: K.filter((e) => e.labor_operation).map((e) => ({
							labor_operation: e.labor_operation,
							operation_name: e.operation_name,
							standard_hours: Number(e.standard_hours) || 0,
							quantity: Number(e.quantity) || 1,
							total_hours:
								Number(e.total_hours) ||
								(Number(e.quantity) || 1) * (Number(e.standard_hours) || 0),
							notes: e.notes,
						})),
						parts_included: Y.filter((e) => e.part_item).map((e) => ({
							part_item: e.part_item,
							part_name: e.part_name,
							quantity: Number(e.quantity) || 1,
							unit_price: Number(e.unit_price) || 0,
						})),
					};
					y(!0);
					try {
						l && t
							? (await N.Z6(t, e), r.o.success("Service package updated"))
							: (await N.AQ(e), r.o.success("Service package created")),
							i?.(),
							a(!1);
					} catch (e) {
						r.o.error(
							e instanceof Error ? e.message : "Failed to save service package"
						);
					} finally {
						y(!1);
					}
				}
				return (0, s.jsx)(x.lG, {
					open: e,
					onOpenChange: a,
					children: (0, s.jsxs)(x.Cf, {
						className: "sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden",
						children: [
							(0, s.jsxs)(x.c7, {
								className: "shrink-0",
								children: [
									(0, s.jsx)(x.L3, {
										children: l
											? "Edit Service Package"
											: "New Service Package",
									}),
									(0, s.jsx)(x.rr, {
										children:
											"Bundle labour operations, included parts, and pricing for a vehicle model service interval. Packages can be applied on Service Estimates and Job Cards.",
									}),
								],
							}),
							(0, s.jsx)("div", {
								className: "min-h-0 flex-1 space-y-5 overflow-y-auto py-2",
								children: o
									? (0, s.jsx)("div", {
											className: "flex justify-center py-10",
											children: (0, s.jsx)(m.A, {
												className:
													"h-5 w-5 animate-spin text-muted-foreground",
											}),
									  })
									: (0, s.jsxs)(s.Fragment, {
											children: [
												(0, s.jsxs)("div", {
													className: "grid gap-3 sm:grid-cols-3",
													children: [
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsxs)(v.J, {
																	htmlFor: "package-name",
																	children: [
																		"Package Name ",
																		(0, s.jsx)("span", {
																			className:
																				"text-destructive",
																			children: "*",
																		}),
																	],
																}),
																(0, s.jsx)(g.p, {
																	id: "package-name",
																	value: C,
																	onChange: (e) =>
																		J(e.target.value),
																	placeholder: "e.g. JX50-5K",
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)(v.J, {
																	htmlFor: "package-id",
																	children: "Package ID",
																}),
																(0, s.jsx)(g.p, {
																	id: "package-id",
																	value: $,
																	onChange: (e) =>
																		P(e.target.value),
																	placeholder: "e.g. 5k",
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)(v.J, {
																	htmlFor: "package-km",
																	children:
																		"Service Interval (KM)",
																}),
																(0, s.jsx)(g.p, {
																	id: "package-km",
																	type: "number",
																	value: L,
																	onChange: (e) =>
																		q(e.target.value),
																}),
															],
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "grid gap-3 sm:grid-cols-2",
													children: [
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)(v.J, {
																	htmlFor: "package-months",
																	children:
																		"Service Interval (Months)",
																}),
																(0, s.jsx)(g.p, {
																	id: "package-months",
																	type: "number",
																	value: Q,
																	onChange: (e) =>
																		D(e.target.value),
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)(v.J, {
																	htmlFor: "package-description",
																	children: "Description",
																}),
																(0, s.jsx)(g.p, {
																	id: "package-description",
																	value: F,
																	onChange: (e) =>
																		E(e.target.value),
																	placeholder:
																		"Shown when picking the package",
																}),
															],
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsx)(v.J, {
															children: "Applicable Vehicle Models",
														}),
														(0, s.jsx)("div", {
															className:
																"flex min-h-10 flex-wrap gap-1.5 rounded-md border bg-background px-2 py-2",
															children:
																0 === R.length
																	? (0, s.jsx)("span", {
																			className:
																				"px-1 text-xs text-muted-foreground",
																			children:
																				"Add one or more vehicle models this package applies to",
																	  })
																	: R.map((e) =>
																			(0, s.jsxs)(
																				"span",
																				{
																					className:
																						"inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs",
																					children: [
																						e.label,
																						(0, s.jsx)(
																							"button",
																							{
																								type: "button",
																								className:
																									"text-muted-foreground hover:text-foreground",
																								onClick:
																									() =>
																										X(
																											(
																												a
																											) =>
																												a.filter(
																													(
																														a
																													) =>
																														a.name !==
																														e.name
																												)
																										),
																								"aria-label": `Remove ${e.label}`,
																								children:
																									(0,
																									s.jsx)(
																										u.A,
																										{
																											className:
																												"h-3 w-3",
																										}
																									),
																							}
																						),
																					],
																				},
																				e.name
																			)
																	  ),
														}),
														(0, s.jsx)(_.Zi, {
															value: "",
															onValueChange: function (e) {
																if (
																	!e ||
																	R.some((a) => a.name === e)
																)
																	return;
																let a = (er || []).find(
																	(a) => a.name === e
																);
																X((t) => [
																	...t,
																	{
																		name: e,
																		label: a ? O(a) : e,
																	},
																]),
																	ea("");
															},
															onSearchChange: ea,
															placeholder: "Add vehicle model…",
															isLoading: el,
															options: eu,
															portaled: !0,
															keepOpenOnSelect: !0,
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsxs)("div", {
															className:
																"flex items-center justify-between",
															children: [
																(0, s.jsx)(v.J, {
																	children: "Labour Operations",
																}),
																(0, s.jsxs)("span", {
																	className:
																		"text-xs text-muted-foreground",
																	children: [
																		"Total ",
																		eg.toFixed(2),
																		" h",
																	],
																}),
															],
														}),
														(0, s.jsx)("div", {
															className: "space-y-2",
															children: K.map((e) =>
																(0, s.jsxs)(
																	"div",
																	{
																		className:
																			"grid grid-cols-1 gap-2 rounded-lg border p-2 sm:grid-cols-12",
																		children: [
																			(0, s.jsx)("div", {
																				className:
																					"sm:col-span-5",
																				children: (0,
																				s.jsx)(_.Zi, {
																					value: e.labor_operation,
																					onValueChange:
																						(a) => {
																							let t =
																									(
																										eo ||
																										[]
																									).find(
																										(
																											e
																										) =>
																											e.name ===
																											a
																									),
																								s =
																									Number(
																										t?.custom_estimated_timehours
																									) ||
																									0;
																							ex(
																								e.key,
																								{
																									labor_operation:
																										a,
																									operation_name:
																										t?.service_item ||
																										t?.custom_item_name ||
																										e.operation_name,
																									standard_hours:
																										s,
																									total_hours:
																										s *
																										(Number(
																											e.quantity
																										) ||
																											1),
																								}
																							);
																						},
																					onSearchChange:
																						es,
																					placeholder:
																						"Service item…",
																					isLoading: ec,
																					options: eh,
																					valueLabel:
																						e.operation_name ||
																						e.labor_operation,
																					portaled: !0,
																				}),
																			}),
																			(0, s.jsx)("div", {
																				className:
																					"sm:col-span-3",
																				children: (0,
																				s.jsx)(g.p, {
																					value: e.operation_name,
																					onChange: (
																						a
																					) =>
																						ex(e.key, {
																							operation_name:
																								a
																									.target
																									.value,
																						}),
																					placeholder:
																						"Operation name",
																				}),
																			}),
																			(0, s.jsx)("div", {
																				className:
																					"sm:col-span-1",
																				children: (0,
																				s.jsx)(g.p, {
																					type: "number",
																					value: String(
																						e.quantity
																					),
																					onChange: (
																						a
																					) => {
																						let t = A(
																							a
																								.target
																								.value
																						);
																						ex(e.key, {
																							quantity:
																								t,
																							total_hours:
																								t *
																								(Number(
																									e.standard_hours
																								) ||
																									0),
																						});
																					},
																					placeholder:
																						"Qty",
																				}),
																			}),
																			(0, s.jsx)("div", {
																				className:
																					"sm:col-span-2",
																				children: (0,
																				s.jsx)(g.p, {
																					type: "number",
																					value: String(
																						e.total_hours
																					),
																					onChange: (
																						a
																					) =>
																						ex(e.key, {
																							total_hours:
																								A(
																									a
																										.target
																										.value
																								),
																						}),
																					placeholder:
																						"Hours",
																				}),
																			}),
																			(0, s.jsx)("div", {
																				className:
																					"flex items-center justify-end sm:col-span-1",
																				children: (0,
																				s.jsx)(f.$, {
																					type: "button",
																					variant:
																						"ghost",
																					size: "icon",
																					className:
																						"text-destructive",
																					disabled:
																						1 ===
																						K.length,
																					"aria-label":
																						"Remove labour operation",
																					onClick: () =>
																						W((a) =>
																							1 ===
																							a.length
																								? [
																										S(),
																								  ]
																								: a.filter(
																										(
																											a
																										) =>
																											a.key !==
																											e.key
																								  )
																						),
																					children: (0,
																					s.jsx)(h.A, {
																						className:
																							"h-4 w-4",
																					}),
																				}),
																			}),
																		],
																	},
																	e.key
																)
															),
														}),
														(0, s.jsxs)(f.$, {
															type: "button",
															variant: "outline",
															size: "sm",
															onClick: () => W((e) => [...e, S()]),
															children: [
																(0, s.jsx)(p.A, {
																	className: "mr-2 h-4 w-4",
																}),
																"Add labour operation",
															],
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "space-y-2",
													children: [
														(0, s.jsxs)("div", {
															className:
																"flex items-center justify-between",
															children: [
																(0, s.jsx)(v.J, {
																	children: "Parts Included",
																}),
																(0, s.jsxs)("span", {
																	className:
																		"text-xs text-muted-foreground",
																	children: [
																		"Parts total ",
																		null == ev ||
																		Number.isNaN(Number(ev))
																			? "—"
																			: new Intl.NumberFormat(
																					"en-US",
																					{
																						minimumFractionDigits: 2,
																						maximumFractionDigits: 2,
																					}
																			  ).format(Number(ev)),
																	],
																}),
															],
														}),
														(0, s.jsx)("div", {
															className: "space-y-2",
															children: Y.map((e) =>
																(0, s.jsxs)(
																	"div",
																	{
																		className:
																			"grid grid-cols-1 gap-2 rounded-lg border p-2 sm:grid-cols-12",
																		children: [
																			(0, s.jsx)("div", {
																				className:
																					"sm:col-span-6",
																				children: (0,
																				s.jsx)(_.Zi, {
																					value: e.part_item,
																					onValueChange:
																						(a) => {
																							let t =
																								(
																									ed ||
																									[]
																								).find(
																									(
																										e
																									) =>
																										e.name ===
																										a
																								);
																							ef(
																								e.key,
																								{
																									part_item:
																										a,
																									part_name:
																										t?.item_name ||
																										e.part_name,
																								}
																							);
																						},
																					onSearchChange:
																						ei,
																					placeholder:
																						"Spare part…",
																					isLoading: em,
																					options: ep,
																					valueLabel:
																						e.part_name ||
																						e.part_item,
																					portaled: !0,
																				}),
																			}),
																			(0, s.jsx)("div", {
																				className:
																					"sm:col-span-2",
																				children: (0,
																				s.jsx)(g.p, {
																					type: "number",
																					value: String(
																						e.quantity
																					),
																					onChange: (
																						a
																					) =>
																						ef(e.key, {
																							quantity:
																								A(
																									a
																										.target
																										.value
																								),
																						}),
																					placeholder:
																						"Qty",
																				}),
																			}),
																			(0, s.jsx)("div", {
																				className:
																					"sm:col-span-3",
																				children: (0,
																				s.jsx)(g.p, {
																					type: "number",
																					value: String(
																						e.unit_price
																					),
																					onChange: (
																						a
																					) =>
																						ef(e.key, {
																							unit_price:
																								A(
																									a
																										.target
																										.value
																								),
																						}),
																					placeholder:
																						"Unit price",
																				}),
																			}),
																			(0, s.jsx)("div", {
																				className:
																					"flex items-center justify-end sm:col-span-1",
																				children: (0,
																				s.jsx)(f.$, {
																					type: "button",
																					variant:
																						"ghost",
																					size: "icon",
																					className:
																						"text-destructive",
																					disabled:
																						1 ===
																						Y.length,
																					"aria-label":
																						"Remove part",
																					onClick: () =>
																						G((a) =>
																							1 ===
																							a.length
																								? [
																										w(),
																								  ]
																								: a.filter(
																										(
																											a
																										) =>
																											a.key !==
																											e.key
																								  )
																						),
																					children: (0,
																					s.jsx)(h.A, {
																						className:
																							"h-4 w-4",
																					}),
																				}),
																			}),
																		],
																	},
																	e.key
																)
															),
														}),
														(0, s.jsxs)(f.$, {
															type: "button",
															variant: "outline",
															size: "sm",
															onClick: () => G((e) => [...e, w()]),
															children: [
																(0, s.jsx)(p.A, {
																	className: "mr-2 h-4 w-4",
																}),
																"Add part",
															],
														}),
													],
												}),
												(0, s.jsxs)("div", {
													className: "grid gap-3 sm:grid-cols-4",
													children: [
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)(v.J, {
																	htmlFor: "package-before",
																	children: "Before Discount",
																}),
																(0, s.jsx)(g.p, {
																	id: "package-before",
																	type: "number",
																	value: B,
																	onChange: (e) =>
																		Z(e.target.value),
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)(v.J, {
																	htmlFor: "package-after",
																	children: "After Discount",
																}),
																(0, s.jsx)(g.p, {
																	id: "package-after",
																	type: "number",
																	value: H,
																	onChange: (e) =>
																		V(e.target.value),
																}),
															],
														}),
														(0, s.jsxs)("div", {
															className: "space-y-2",
															children: [
																(0, s.jsx)(v.J, {
																	htmlFor:
																		"package-labour-discount",
																	children: "Labour Discount",
																}),
																(0, s.jsx)(g.p, {
																	id: "package-labour-discount",
																	type: "number",
																	value: z,
																	onChange: (e) =>
																		I(e.target.value),
																}),
															],
														}),
														(0, s.jsx)("div", {
															className: "flex items-end pb-2",
															children: (0, s.jsxs)("div", {
																className:
																	"flex items-center gap-2",
																children: [
																	(0, s.jsx)(b.S, {
																		id: "package-active",
																		checked: M,
																		onCheckedChange: (e) =>
																			U(!!e),
																	}),
																	(0, s.jsx)(v.J, {
																		htmlFor: "package-active",
																		className:
																			"cursor-pointer text-sm font-normal",
																		children: "Active",
																	}),
																],
															}),
														}),
													],
												}),
												(0, s.jsx)("p", {
													className: "text-xs text-muted-foreground",
													children:
														"Total amount defaults to the After Discount value; the chargeable package amount is recalculated when the package is applied.",
												}),
											],
									  }),
							}),
							(0, s.jsxs)(x.Es, {
								className: "shrink-0 border-t pt-4",
								children: [
									(0, s.jsx)(f.$, {
										variant: "outline",
										onClick: () => a(!1),
										disabled: d,
										children: "Cancel",
									}),
									(0, s.jsxs)(f.$, {
										onClick: () => void eb(),
										disabled: d || o,
										children: [
											d
												? (0, s.jsx)(m.A, {
														className: "mr-2 h-4 w-4 animate-spin",
												  })
												: null,
											l ? "Update" : "Create",
										],
									}),
								],
							}),
						],
					}),
				});
			}
			var C = t(33745),
				J = t(93408),
				$ = t(79984),
				P = t(38291),
				F = t(43447),
				E = t(83786),
				L = t(15306),
				q = t(61878),
				Q = t(24642),
				D = t(60285),
				z = t(7915),
				I = t(49387),
				B = t(13175),
				Z = t(12651),
				H = t(63360);
			function V(e) {
				return null == e || Number.isNaN(Number(e))
					? "—"
					: new Intl.NumberFormat("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
					  }).format(Number(e));
			}
			function M(e) {
				return (
					(e &&
						(Number(e.total_amount) ||
							Number(e.after_discount) ||
							Number(e.before_discount))) ||
					0
				);
			}
			function U(e) {
				if (!e) return [];
				let a = (e.applicable_vehicle_models || [])
					.map((e) => ("string" == typeof e ? e : e?.vehicle_model))
					.filter((e) => !!e);
				return 0 === a.length && e.vehicle_model ? [e.vehicle_model] : a;
			}
			function R(e) {
				return !!e && 1 === Number(e.is_active ?? 0);
			}
			function X() {
				let { canDelete: e, canWrite: a, canCreate: t } = (0, H.Sk)(),
					u = a("service-packages"),
					p = e("service-packages"),
					x = t("service-packages"),
					v = a("service-packages"),
					[b, _] = (0, c.P)("service-packages", "search", ""),
					[j, y] = (0, n.useState)(b),
					[k, S] = (0, c.P)("service-packages", "active_filter", "active"),
					[w, A] = (0, n.useState)(1),
					[O, X] = (0, n.useState)(50),
					[K, W] = (0, n.useState)(null),
					[Y, G] = (0, n.useState)(!1),
					[ee, ea] = (0, n.useState)(null),
					[et, es] = (0, n.useState)(null),
					[en, ei] = (0, n.useState)(null);
				(0, n.useEffect)(() => {
					let e = window.setTimeout(() => y(b.trim()), 250);
					return () => window.clearTimeout(e);
				}, [b]),
					(0, n.useEffect)(() => {
						A(1);
					}, [j, k]);
				let {
						data: er,
						isLoading: el,
						error: eo,
						mutate: ec,
					} = (0, i.Ay)(["service-packages-master", j, k, w, O], () =>
						N.RJ({
							search: j || void 0,
							active_filter: k,
							limit: O,
							offset: (w - 1) * O,
						})
					),
					{
						data: ed,
						isLoading: em,
						mutate: eu,
					} = (0, i.Ay)(K ? ["service-package", K] : null, () => N.kd(K)),
					eh = er?.total || 0,
					{
						items: ep,
						loadedCount: ex,
						isLoadingMore: ef,
						loadMore: eg,
					} = (0, o.h)({
						items: er?.data,
						total: eh,
						offset: (w - 1) * O,
						resetKey: [j, k, w, O].join("|"),
						enabled: O >= o.J,
						fetchMore: async (e, a) =>
							(
								await N.RJ({
									search: j || void 0,
									active_filter: k,
									limit: a,
									offset: e,
								})
							).data,
					});
				function ev() {
					ea(null), G(!0);
				}
				function eb(e) {
					ea(e.name), G(!0);
				}
				async function e_(e) {
					if (!u) return;
					let a = +!R(e);
					es(e.name);
					try {
						await N.Z6(e.name, { is_active: a }),
							r.o.success(
								a ? "Service package enabled" : "Service package disabled"
							),
							ec(),
							K === e.name && eu();
					} catch (e) {
						r.o.error(e instanceof Error ? e.message : "Failed to update status");
					} finally {
						es(null);
					}
				}
				async function ej(e) {
					ei(e.name);
					try {
						await N.ns(e.name),
							r.o.success("Service package deleted"),
							K === e.name && W(null),
							ec();
					} catch (e) {
						r.o.error(
							e instanceof Error ? e.message : "Failed to delete service package"
						);
					} finally {
						ei(null);
					}
				}
				return (0, s.jsxs)("div", {
					className: "min-w-0 space-y-4 sm:space-y-6",
					children: [
						(0, s.jsxs)("div", {
							className:
								"flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
							children: [
								(0, s.jsxs)("div", {
									children: [
										(0, s.jsx)("h1", {
											className: "dms-stat-value text-xl tracking-tight",
											children: "Service Packages",
										}),
										(0, s.jsx)("p", {
											className: "text-muted-foreground",
											children:
												"Bundled labour operations, parts, and pricing per service interval",
										}),
									],
								}),
								(0, s.jsx)("div", {
									className: "flex items-center gap-2",
									children: (0, s.jsx)(C.l, {
										module: "service-packages",
										label: "New Service Package",
										onClick: ev,
									}),
								}),
							],
						}),
						(0, s.jsx)($.Zp, {
							children: (0, s.jsxs)($.Wu, {
								className: "pt-6 space-y-4",
								children: [
									(0, s.jsxs)("div", {
										className:
											"flex flex-col gap-3 sm:flex-row sm:items-center",
										children: [
											(0, s.jsxs)("div", {
												className: "relative flex-1",
												children: [
													(0, s.jsx)(q.A, {
														className:
															"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
													}),
													(0, s.jsx)(g.p, {
														className: "pl-9",
														placeholder:
															"Search package name, ID, description…",
														value: b,
														onChange: (e) => _(e.target.value),
													}),
												],
											}),
											(0, s.jsx)(L.tU, {
												value: k,
												onValueChange: (e) => S(e),
												className: "w-full sm:w-auto",
												children: (0, s.jsxs)(L.j7, {
													className: "w-full sm:w-auto",
													children: [
														(0, s.jsx)(L.Xi, {
															value: "active",
															className: "flex-1 sm:flex-none",
															children: "Active",
														}),
														(0, s.jsx)(L.Xi, {
															value: "all",
															className: "flex-1 sm:flex-none",
															children: "All",
														}),
														(0, s.jsx)(L.Xi, {
															value: "inactive",
															className: "flex-1 sm:flex-none",
															children: "Inactive",
														}),
													],
												}),
											}),
										],
									}),
									el
										? (0, s.jsx)("div", {
												className: "flex justify-center py-12",
												children: (0, s.jsx)(m.A, {
													className:
														"h-6 w-6 animate-spin text-muted-foreground",
												}),
										  })
										: eo
										? (0, s.jsx)("p", {
												className:
													"py-8 text-center text-sm text-destructive",
												children:
													eo.message ||
													"Failed to load service packages",
										  })
										: 0 === ep.length
										? (0, s.jsxs)("div", {
												className:
													"flex flex-col items-center py-12 text-muted-foreground",
												children: [
													(0, s.jsx)(Q.A, {
														className: "mb-2 h-10 w-10 opacity-40",
													}),
													(0, s.jsx)("p", {
														className: "text-sm",
														children: "No service packages found",
													}),
													x
														? (0, s.jsx)(f.$, {
																variant: "outline",
																size: "sm",
																className: "mt-4",
																onClick: ev,
																children:
																	"Create the first package",
														  })
														: null,
												],
										  })
										: (0, s.jsx)("div", {
												className: "overflow-x-auto rounded-md border",
												children: (0, s.jsxs)(E.XI, {
													children: [
														(0, s.jsx)(E.A0, {
															children: (0, s.jsxs)(E.Hj, {
																children: [
																	(0, s.jsx)(E.nd, {
																		children: "Package",
																	}),
																	(0, s.jsx)(E.nd, {
																		children: "Package ID",
																	}),
																	(0, s.jsx)(E.nd, {
																		children: "Vehicle Models",
																	}),
																	(0, s.jsx)(E.nd, {
																		children: "Interval",
																	}),
																	(0, s.jsx)(E.nd, {
																		className: "text-right",
																		children: "Labour Hours",
																	}),
																	(0, s.jsx)(E.nd, {
																		className: "text-right",
																		children: "Total",
																	}),
																	(0, s.jsx)(E.nd, {
																		children: "Status",
																	}),
																	(0, s.jsx)(E.nd, {
																		className:
																			"w-[1%] text-right",
																		children: "Actions",
																	}),
																],
															}),
														}),
														(0, s.jsx)(E.BF, {
															children: ep.map((e, a) => {
																let t = U(e),
																	n =
																		et === e.name ||
																		en === e.name;
																return (0, s.jsxs)(
																	E.Hj,
																	{
																		className:
																			"cursor-pointer",
																		onClick: () => W(e.name),
																		children: [
																			(0, s.jsxs)(E.nA, {
																				children: [
																					(0, s.jsx)(
																						"div",
																						{
																							className:
																								"font-medium",
																							children:
																								e.package_name ||
																								e.name,
																						}
																					),
																					e.description
																						? (0,
																						  s.jsx)(
																								"div",
																								{
																									className:
																										"line-clamp-1 text-xs text-muted-foreground",
																									children:
																										e.description,
																								}
																						  )
																						: null,
																				],
																			}),
																			(0, s.jsx)(E.nA, {
																				className:
																					"text-sm",
																				children:
																					e.package_id ||
																					"—",
																			}),
																			(0, s.jsx)(E.nA, {
																				className:
																					"text-sm",
																				children:
																					0 === t.length
																						? "—"
																						: (0,
																						  s.jsxs)(
																								"div",
																								{
																									className:
																										"flex flex-wrap gap-1",
																									children:
																										[
																											t
																												.slice(
																													0,
																													3
																												)
																												.map(
																													(
																														e
																													) =>
																														(0,
																														s.jsx)(
																															P.E,
																															{
																																variant:
																																	"outline",
																																className:
																																	"font-normal",
																																children:
																																	e,
																															},
																															e
																														)
																												),
																											t.length >
																											3
																												? (0,
																												  s.jsxs)(
																														P.E,
																														{
																															variant:
																																"outline",
																															className:
																																"font-normal",
																															children:
																																[
																																	"+",
																																	t.length -
																																		3,
																																],
																														}
																												  )
																												: null,
																										],
																								}
																						  ),
																			}),
																			(0, s.jsxs)(E.nA, {
																				className:
																					"text-sm tabular-nums",
																				children: [
																					e.interval_km
																						? `${e.interval_km} km`
																						: "—",
																					e.interval_months
																						? ` / ${e.interval_months} mo`
																						: "",
																				],
																			}),
																			(0, s.jsx)(E.nA, {
																				className:
																					"text-right text-sm tabular-nums",
																				children:
																					null !=
																					e.total_labor_hours
																						? Number(
																								e.total_labor_hours
																						  ).toFixed(
																								2
																						  )
																						: "—",
																			}),
																			(0, s.jsx)(E.nA, {
																				className:
																					"text-right text-sm tabular-nums",
																				children: V(M(e)),
																			}),
																			(0, s.jsx)(E.nA, {
																				children: R(e)
																					? (0, s.jsx)(
																							P.E,
																							{
																								variant:
																									"secondary",
																								children:
																									"Active",
																							}
																					  )
																					: (0, s.jsx)(
																							P.E,
																							{
																								variant:
																									"outline",
																								className:
																									"text-muted-foreground",
																								children:
																									"Inactive",
																							}
																					  ),
																			}),
																			(0, s.jsx)(E.nA, {
																				onClick: (e) =>
																					e.stopPropagation(),
																				children: (0,
																				s.jsx)(J.m, {
																					doctype:
																						"Vehicle Service Package",
																					docName:
																						e.name,
																					showPrint: !1,
																					children: (0,
																					s.jsxs)(F.rI, {
																						children: [
																							(0,
																							s.jsx)(
																								F.ty,
																								{
																									asChild:
																										!0,
																									children:
																										(0,
																										s.jsx)(
																											f.$,
																											{
																												variant:
																													"ghost",
																												size: "icon",
																												className:
																													"h-8 w-8 shrink-0",
																												disabled:
																													n,
																												children:
																													n
																														? (0,
																														  s.jsx)(
																																m.A,
																																{
																																	className:
																																		"h-4 w-4 animate-spin",
																																}
																														  )
																														: (0,
																														  s.jsx)(
																																D.A,
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
																							s.jsxs)(
																								F.SQ,
																								{
																									align: "end",
																									children:
																										[
																											(0,
																											s.jsxs)(
																												F._2,
																												{
																													onClick:
																														() =>
																															W(
																																e.name
																															),
																													children:
																														[
																															(0,
																															s.jsx)(
																																z.A,
																																{
																																	className:
																																		"mr-2 h-4 w-4",
																																}
																															),
																															"View Details",
																														],
																												}
																											),
																											v
																												? (0,
																												  s.jsxs)(
																														F._2,
																														{
																															onClick:
																																() =>
																																	eb(
																																		e
																																	),
																															children:
																																[
																																	(0,
																																	s.jsx)(
																																		I.A,
																																		{
																																			className:
																																				"mr-2 h-4 w-4",
																																		}
																																	),
																																	"Edit",
																																],
																														}
																												  )
																												: null,
																											u
																												? (0,
																												  s.jsx)(
																														F._2,
																														{
																															className:
																																R(
																																	e
																																)
																																	? "text-destructive focus:text-destructive"
																																	: void 0,
																															onClick:
																																() =>
																																	void e_(
																																		e
																																	),
																															children:
																																R(
																																	e
																																)
																																	? (0,
																																	  s.jsxs)(
																																			s.Fragment,
																																			{
																																				children:
																																					[
																																						(0,
																																						s.jsx)(
																																							B.A,
																																							{
																																								className:
																																									"mr-2 h-4 w-4",
																																							}
																																						),
																																						"Disable",
																																					],
																																			}
																																	  )
																																	: (0,
																																	  s.jsxs)(
																																			s.Fragment,
																																			{
																																				children:
																																					[
																																						(0,
																																						s.jsx)(
																																							Z.A,
																																							{
																																								className:
																																									"mr-2 h-4 w-4",
																																							}
																																						),
																																						"Enable",
																																					],
																																			}
																																	  ),
																														}
																												  )
																												: null,
																											p
																												? (0,
																												  s.jsxs)(
																														F._2,
																														{
																															className:
																																"text-destructive focus:text-destructive",
																															onClick:
																																() =>
																																	void ej(
																																		e
																																	),
																															children:
																																[
																																	(0,
																																	s.jsx)(
																																		h.A,
																																		{
																																			className:
																																				"mr-2 h-4 w-4",
																																		}
																																	),
																																	"Delete",
																																],
																														}
																												  )
																												: null,
																										],
																								}
																							),
																						],
																					}),
																				}),
																			}),
																		],
																	},
																	e.name || `row-${a}`
																);
															}),
														}),
													],
												}),
										  }),
									(0, s.jsx)(l.$, {
										page: w,
										pageSize: O,
										totalItems: eh,
										loadedCount: ex,
										onPageChange: A,
										onPageSizeChange: X,
										onLoadMore: eg,
										isLoadingMore: ef,
									}),
								],
							}),
						}),
						(0, s.jsx)(d.BN, {
							open: !!K && !Y,
							onOpenChange: (e) => !e && W(null),
							title: ed?.package_name || K || "Service Package",
							subtitle: ed?.package_id || ed?.name,
							badge: ed
								? {
										label: R(ed) ? "Active" : "Inactive",
										variant: R(ed) ? "secondary" : "outline",
								  }
								: void 0,
							footer: ed
								? (0, s.jsxs)("div", {
										className:
											"flex flex-col gap-2 sm:flex-row sm:justify-end",
										children: [
											u
												? (0, s.jsx)(f.$, {
														variant: "outline",
														className: "w-full sm:w-auto",
														onClick: () => void e_(ed),
														children: R(ed) ? "Disable" : "Enable",
												  })
												: null,
											(0, s.jsxs)(f.$, {
												className: "w-full sm:w-auto",
												disabled: !v,
												onClick: () => eb(ed),
												children: [
													(0, s.jsx)(I.A, { className: "mr-2 h-4 w-4" }),
													"Edit",
												],
											}),
										],
								  })
								: null,
							children: em
								? (0, s.jsx)("div", {
										className: "flex justify-center py-8",
										children: (0, s.jsx)(m.A, {
											className:
												"h-5 w-5 animate-spin text-muted-foreground",
										}),
								  })
								: ed
								? (0, s.jsxs)(s.Fragment, {
										children: [
											(0, s.jsxs)(d.JH, {
												title: "Package",
												children: [
													(0, s.jsx)(d.Qb, {
														label: "Name",
														value: ed.package_name,
													}),
													(0, s.jsx)(d.Qb, {
														label: "Package ID",
														value: ed.package_id,
													}),
													(0, s.jsx)(d.Qb, {
														label: "Status",
														value: R(ed) ? "Active" : "Inactive",
													}),
													(0, s.jsx)(d.Qb, {
														label: "Description",
														value: ed.description,
													}),
												],
											}),
											(0, s.jsxs)(d.JH, {
												title: "Applicability",
												children: [
													(0, s.jsx)(d.Qb, {
														label: "Vehicle models",
														value: U(ed).length
															? (0, s.jsx)("div", {
																	className:
																		"flex flex-wrap gap-1 sm:justify-end",
																	children: U(ed).map((e) =>
																		(0, s.jsx)(
																			P.E,
																			{
																				variant: "outline",
																				className:
																					"font-normal",
																				children: e,
																			},
																			e
																		)
																	),
															  })
															: null,
													}),
													(0, s.jsx)(d.Qb, {
														label: "Service interval",
														value:
															[
																ed.interval_km
																	? `${ed.interval_km} km`
																	: null,
																ed.interval_months
																	? `${ed.interval_months} months`
																	: null,
															]
																.filter(Boolean)
																.join(" / ") || null,
													}),
												],
											}),
											(0, s.jsx)(d.JH, {
												title: "Labour Operations",
												children:
													0 === (ed.labor_operations || []).length
														? (0, s.jsx)("p", {
																className:
																	"text-sm text-muted-foreground",
																children: "No labour operations",
														  })
														: (ed.labor_operations || []).map((e) =>
																(0, s.jsx)(
																	d.Qb,
																	{
																		label:
																			e.operation_name ||
																			e.labor_operation,
																		value: `${Number(
																			e.total_hours || 0
																		).toFixed(2)} h`,
																	},
																	`${e.labor_operation}-${e.operation_name}`
																)
														  ),
											}),
											(0, s.jsx)(d.JH, {
												title: "Included Parts",
												children:
													0 === (ed.parts_included || []).length
														? (0, s.jsx)("p", {
																className:
																	"text-sm text-muted-foreground",
																children: "No parts included",
														  })
														: (ed.parts_included || []).map((e) =>
																(0, s.jsx)(
																	d.Qb,
																	{
																		label:
																			e.part_name ||
																			e.part_item,
																		value: `${
																			e.quantity ?? 1
																		} \xd7 ${V(e.unit_price)}`,
																	},
																	e.part_item
																)
														  ),
											}),
											(0, s.jsxs)(d.JH, {
												title: "Pricing",
												children: [
													(0, s.jsx)(d.Qb, {
														label: "Before discount",
														value: V(ed.before_discount),
													}),
													(0, s.jsx)(d.Qb, {
														label: "After discount",
														value: V(ed.after_discount),
													}),
													(0, s.jsx)(d.Qb, {
														label: "Labour discount",
														value: V(ed.labour_discount_amount),
													}),
													(0, s.jsx)(d.Qb, {
														label: "Total",
														value: V(M(ed)),
													}),
												],
											}),
										],
								  })
								: null,
						}),
						(0, s.jsx)(T, {
							open: Y,
							onOpenChange: (e) => {
								G(e), e || ea(null);
							},
							packageName: ee,
							onSaved: () => {
								ec(), K && eu();
							},
						}),
					],
				});
			}
		},
		98883: (e, a, t) => {
			t.d(a, { Qb: () => b, JH: () => v, BN: () => g });
			var s = t(95155);
			t(12115);
			var n = t(29483),
				i = t(33210),
				r = t(91337);
			function l({ ...e }) {
				return (0, s.jsx)(n.bL, { "data-slot": "sheet", ...e });
			}
			function o({ ...e }) {
				return (0, s.jsx)(n.ZL, { "data-slot": "sheet-portal", ...e });
			}
			function c({ className: e, ...a }) {
				return (0, s.jsx)(n.hJ, {
					"data-slot": "sheet-overlay",
					className: (0, r.cn)(
						"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
						e
					),
					...a,
				});
			}
			function d({ className: e, children: a, side: t = "right", ...l }) {
				return (0, s.jsxs)(o, {
					children: [
						(0, s.jsx)(c, {}),
						(0, s.jsxs)(n.UC, {
							"data-slot": "sheet-content",
							className: (0, r.cn)(
								"bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
								"right" === t &&
									"data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
								"left" === t &&
									"data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
								"top" === t &&
									"data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
								"bottom" === t &&
									"data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
								e
							),
							...l,
							children: [
								a,
								(0, s.jsxs)(n.bm, {
									className:
										"ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
									children: [
										(0, s.jsx)(i.A, { className: "size-4" }),
										(0, s.jsx)("span", {
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
			function m({ className: e, ...a }) {
				return (0, s.jsx)("div", {
					"data-slot": "sheet-header",
					className: (0, r.cn)("flex flex-col gap-1.5 p-4", e),
					...a,
				});
			}
			function u({ className: e, ...a }) {
				return (0, s.jsx)(n.hE, {
					"data-slot": "sheet-title",
					className: (0, r.cn)("text-foreground font-semibold", e),
					...a,
				});
			}
			function h({ className: e, ...a }) {
				return (0, s.jsx)(n.VY, {
					"data-slot": "sheet-description",
					className: (0, r.cn)("text-muted-foreground text-sm", e),
					...a,
				});
			}
			var p = t(38291),
				x = t(61991),
				f = t(6296);
			function g({
				open: e,
				onOpenChange: a,
				title: t,
				subtitle: n,
				badge: i,
				isLoading: o,
				onOpenInDesk: c,
				footer: v,
				contentScroll: b = "outer",
				children: _,
			}) {
				return (0, s.jsx)(l, {
					open: e,
					onOpenChange: a,
					children: (0, s.jsxs)(d, {
						side: "right",
						className:
							"flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
						children: [
							(0, s.jsx)(m, {
								className: "shrink-0 bg-dms-green-light px-4 pt-4 pb-3",
								children: (0, s.jsx)("div", {
									className:
										"flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between",
									children: (0, s.jsxs)("div", {
										className: "min-w-0",
										children: [
											(0, s.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [
													(0, s.jsx)(u, {
														className: "text-lg",
														children: t,
													}),
													i &&
														(0, s.jsx)(p.E, {
															variant: i.variant || "secondary",
															className:
																"bg-dms-green text-white border-dms-green",
															children: i.label,
														}),
												],
											}),
											n && (0, s.jsx)(h, { className: "mt-1", children: n }),
										],
									}),
								}),
							}),
							(0, s.jsx)(x.w, { className: "bg-(--dms-green)/20" }),
							o
								? (0, s.jsx)("div", {
										className: "flex items-center justify-center py-20",
										children: (0, s.jsx)(f.A, {
											className: "h-6 w-6 animate-spin text-dms-green",
										}),
								  })
								: (0, s.jsxs)(s.Fragment, {
										children: [
											(0, s.jsx)("div", {
												className: (0, r.cn)(
													"flex min-h-0 flex-1 flex-col px-4 pb-4",
													"inner" === b
														? "overflow-hidden"
														: "overflow-y-auto"
												),
												children: _,
											}),
											v &&
												(0, s.jsx)("div", {
													className:
														"shrink-0 border-t bg-background px-4 py-3",
													children: v,
												}),
										],
								  }),
						],
					}),
				});
			}
			function v({ title: e, children: a, className: t }) {
				return (0, s.jsxs)("div", {
					className: (0, r.cn)("space-y-2", t),
					children: [
						(0, s.jsxs)("h3", {
							className:
								"text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2",
							children: [
								(0, s.jsx)("span", {
									className: "w-1 h-4 rounded-full bg-dms-green",
								}),
								e,
							],
						}),
						(0, s.jsx)("div", {
							className:
								"rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3",
							children: a,
						}),
					],
				});
			}
			function b({ label: e, value: a, className: t }) {
				return (0, s.jsxs)("div", {
					className: (0, r.cn)(
						"flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
						t
					),
					children: [
						(0, s.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: e,
						}),
						(0, s.jsx)("span", {
							className: "text-sm font-medium sm:text-right",
							children: a || "—",
						}),
					],
				});
			}
		},
	},
]);
