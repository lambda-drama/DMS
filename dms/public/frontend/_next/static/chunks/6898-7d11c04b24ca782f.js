"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[6898],
	{
		26898: (e, n, a) => {
			a.d(n, { D: () => N });
			var t = a(95155),
				s = a(12115),
				r = a(74350),
				o = a(4474),
				i = a(39658),
				d = a(95964),
				m = a(79792),
				c = a(39540),
				l = a(26518),
				u = a(10086),
				p = a(52959),
				h = a(71275),
				y = a(68459),
				f = a(6296),
				x = a(66609),
				_ = a(94411),
				g = a(9245),
				v = a(36020);
			function j(e = "", n = 0) {
				return {
					id: crypto.randomUUID(),
					mode_of_payment: e,
					amount: n,
					reference_no: "",
				};
			}
			function N({
				open: e,
				onOpenChange: n,
				customer: a,
				customerName: S,
				company: b,
				jobCard: T,
				serviceEstimate: O,
				defaultAmount: C,
				amendEntry: w,
				onCreated: J,
			}) {
				let A = !!w?.name,
					$ = !!a,
					k = !!b,
					[P, R] = (0, s.useState)(""),
					[D, E] = (0, s.useState)(""),
					[I, L] = (0, s.useState)(""),
					[M, V] = (0, s.useState)([j()]),
					[z, U] = (0, s.useState)(() => new Date().toISOString().split("T")[0]),
					[Z, q] = (0, s.useState)(""),
					[B, F] = (0, s.useState)([]),
					[Q, W] = (0, s.useState)(!1),
					[G, X] = (0, s.useState)(!1),
					{ data: H, isLoading: K } = (0, v.Rr)(),
					{ data: Y, isLoading: ee } = (0, v.dQ)(D);
				(0, v.Tr)(H, K, I, (e) => L(e.name), { enabled: !k });
				let en = (0, s.useMemo)(
						() =>
							(Y ?? []).map((e) => ({
								value: e.name,
								label: e.customer_name || e.name,
								description: e.customer_name ? e.name : void 0,
							})),
						[Y]
					),
					ea = w?.name || "",
					et = w?.mode_of_payment || "",
					es = Number(w?.paid_amount) || 0,
					er = w?.posting_date || "",
					eo = w?.remarks || "";
				(0, s.useEffect)(() => {
					e &&
						(R(a || ""),
						E(""),
						L(b || ""),
						ea
							? (V([j(et, es)]),
							  U(er || new Date().toISOString().split("T")[0]),
							  q(eo))
							: (V([j("", Number(C) > 0 ? Number(C) : 0)]),
							  U(new Date().toISOString().split("T")[0]),
							  q("")));
				}, [e, a, b, C, ea, et, es, er, eo]),
					(0, s.useEffect)(() => {
						if (!e || !I) return;
						let n = !1;
						return (
							W(!0),
							g
								.us(I)
								.then((e) => {
									if (n) return;
									F(e);
									let a = e[0]?.name || "";
									V((e) =>
										e.map((e, n) =>
											0 !== n || e.mode_of_payment
												? e
												: { ...e, mode_of_payment: a }
										)
									);
								})
								.catch(() => {
									n || F([]);
								})
								.finally(() => {
									n || W(!1);
								}),
							() => {
								n = !0;
							}
						);
					}, [e, I]);
				let ei = (e, n) => {
						V((a) => a.map((a) => (a.id === e ? { ...a, ...n } : a)));
					},
					ed = (0, s.useMemo)(
						() => M.reduce((e, n) => e + (Number(n.amount) || 0), 0),
						[M]
					),
					em = T ? `Job Card ${T}` : O ? `Service Estimate ${O}` : null,
					ec = async () => {
						let e = $ ? a : P;
						if (!e) return void x.o.error("Select a customer");
						if (!I) return void x.o.error("Select a company");
						let t = M.filter((e) => Number(e.amount) > 0).map((e) => ({
							mode_of_payment: e.mode_of_payment,
							amount: Number(e.amount),
							reference_no: e.reference_no.trim() || void 0,
						}));
						if (!t.length)
							return void x.o.error(
								"Add at least one advance amount greater than zero"
							);
						if (t.length > 1 && t.some((e) => !e.mode_of_payment))
							return void x.o.error("Select a mode of payment for each row");
						X(!0);
						try {
							let a = await _.R0({
									customer: e,
									company: I,
									amount: 1 === t.length ? t[0].amount : void 0,
									mode_of_payment:
										(1 === t.length && t[0].mode_of_payment) || void 0,
									reference_no: 1 === t.length ? t[0].reference_no : void 0,
									payments: t,
									posting_date: z || void 0,
									remarks: Z || void 0,
									job_card: T || void 0,
									service_estimate: O || void 0,
									amended_from: ea || void 0,
								}),
								s = a.payment_entries || [a.name];
							x.o.success(
								s.length > 1
									? `Downpayment recorded (${s.length} entries: ${s.join(", ")})`
									: ea
									? `Amended as ${a.name}`
									: `Advance ${a.name} recorded`
							),
								J?.({
									name: a.name,
									payment_entries: s,
									paid_amount: a.paid_amount,
									customer: a.customer,
								}),
								n(!1);
						} catch (e) {
							x.o.error(
								e instanceof Error ? e.message : "Failed to record advance payment"
							);
						} finally {
							X(!1);
						}
					};
				return (0, t.jsx)(r.lG, {
					open: e,
					onOpenChange: n,
					children: (0, t.jsxs)(r.Cf, {
						className: "sm:max-w-lg",
						children: [
							(0, t.jsxs)(r.c7, {
								children: [
									(0, t.jsxs)(r.L3, {
										className: "flex items-center gap-2",
										children: [
											(0, t.jsx)(h.A, { className: "h-5 w-5" }),
											A ? "Amend advance payment" : "Record advance payment",
										],
									}),
									(0, t.jsx)(r.rr, {
										children: A
											? `Replaces cancelled ${ea}. Change the amount or mode(s) of payment, then record the amendment.`
											: em
											? `Customer advance / downpayment for ${em}. It stays available until an invoice is raised.`
											: "Standalone customer advance / downpayment. It stays available until an invoice is raised.",
									}),
								],
							}),
							(0, t.jsxs)("div", {
								className: "space-y-4 py-2",
								children: [
									$
										? (0, t.jsxs)("div", {
												className: "space-y-1.5",
												children: [
													(0, t.jsx)(m.J, { children: "Customer" }),
													(0, t.jsxs)("p", {
														className: "text-sm font-medium",
														children: [
															S || a,
															S
																? (0, t.jsx)("span", {
																		className:
																			"ml-2 text-xs text-muted-foreground",
																		children: a,
																  })
																: null,
														],
													}),
												],
										  })
										: (0, t.jsxs)("div", {
												className: "space-y-1.5",
												children: [
													(0, t.jsx)(m.J, { children: "Customer *" }),
													(0, t.jsx)(u.Zi, {
														options: en,
														value: P,
														onValueChange: R,
														onSearchChange: E,
														placeholder: "Search customers...",
														isLoading: ee,
														portaled: !0,
													}),
												],
										  }),
									(0, t.jsxs)("div", {
										className: "grid gap-4 sm:grid-cols-2",
										children: [
											(0, t.jsxs)("div", {
												className: "space-y-1.5",
												children: [
													(0, t.jsx)(m.J, { children: "Company *" }),
													k
														? (0, t.jsx)("p", {
																className: "text-sm font-medium",
																children: b,
														  })
														: (0, t.jsx)(u.Zi, {
																options: (H ?? []).map((e) => ({
																	value: e.name,
																	label: e.name,
																})),
																value: I,
																onValueChange: L,
																placeholder: "Select company",
																isLoading: K,
																portaled: !0,
														  }),
												],
											}),
											(0, t.jsxs)("div", {
												className: "space-y-1.5",
												children: [
													(0, t.jsx)(m.J, {
														children: "Posting date *",
													}),
													(0, t.jsx)(i.p, {
														type: "date",
														value: z,
														onChange: (e) => U(e.target.value),
													}),
												],
											}),
										],
									}),
									(0, t.jsxs)("div", {
										className: "space-y-3",
										children: [
											(0, t.jsxs)("div", {
												className:
													"flex items-center justify-between gap-2",
												children: [
													(0, t.jsx)(m.J, {
														children: "Downpayment modes *",
													}),
													(0, t.jsx)("span", {
														className: "text-xs text-muted-foreground",
														children: A
															? "Change the amount or mode"
															: "Split across cash / bank as needed",
													}),
												],
											}),
											(0, t.jsxs)("div", {
												className:
													"hidden items-center gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(7rem,0.7fr)_minmax(0,1fr)_2.25rem]",
												children: [
													(0, t.jsx)("span", { children: "Mode *" }),
													(0, t.jsx)("span", { children: "Amount *" }),
													(0, t.jsx)("span", {
														children: "Reference (optional)",
													}),
													(0, t.jsx)("span", {
														className: "sr-only",
														children: "Remove",
													}),
												],
											}),
											M.map((e) =>
												(0, t.jsxs)(
													"div",
													{
														className:
															"grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(7rem,0.7fr)_minmax(0,1fr)_2.25rem] sm:border-0 sm:p-0",
														children: [
															(0, t.jsxs)("div", {
																className:
																	"space-y-1 sm:space-y-0",
																children: [
																	(0, t.jsx)(m.J, {
																		className:
																			"text-xs sm:hidden",
																		children: "Mode *",
																	}),
																	(0, t.jsxs)(l.l6, {
																		value:
																			e.mode_of_payment ||
																			void 0,
																		onValueChange: (n) =>
																			ei(e.id, {
																				mode_of_payment: n,
																			}),
																		disabled:
																			Q || 0 === B.length,
																		children: [
																			(0, t.jsx)(l.bq, {
																				children: (0,
																				t.jsx)(l.yv, {
																					placeholder: Q
																						? "Loading…"
																						: "Select mode",
																				}),
																			}),
																			(0, t.jsx)(l.gC, {
																				children: B.map(
																					(e) =>
																						(0, t.jsx)(
																							l.eb,
																							{
																								value: e.name,
																								children:
																									e.name,
																							},
																							e.name
																						)
																				),
																			}),
																		],
																	}),
																],
															}),
															(0, t.jsxs)("div", {
																className:
																	"space-y-1 sm:space-y-0",
																children: [
																	(0, t.jsx)(m.J, {
																		className:
																			"text-xs sm:hidden",
																		children: "Amount *",
																	}),
																	(0, t.jsx)(d.Q, {
																		min: 0,
																		blankWhenZero: !1,
																		value: e.amount,
																		onValueChange: (n) =>
																			ei(e.id, {
																				amount: n,
																			}),
																		placeholder: "0.00",
																	}),
																],
															}),
															(0, t.jsxs)("div", {
																className:
																	"space-y-1 sm:space-y-0",
																children: [
																	(0, t.jsx)(m.J, {
																		className:
																			"text-xs sm:hidden",
																		children: "Reference",
																	}),
																	(0, t.jsx)(i.p, {
																		value: e.reference_no,
																		onChange: (n) =>
																			ei(e.id, {
																				reference_no:
																					n.target.value,
																			}),
																		placeholder:
																			"Cheque / txn ref",
																	}),
																],
															}),
															(0, t.jsx)(o.$, {
																type: "button",
																variant: "ghost",
																size: "icon",
																className:
																	"h-9 w-9 justify-self-end text-destructive sm:justify-self-center",
																disabled: M.length <= 1 || A,
																onClick: () => {
																	var n;
																	return (
																		(n = e.id),
																		void V((e) =>
																			e.length <= 1
																				? e
																				: e.filter(
																						(e) =>
																							e.id !==
																							n
																				  )
																		)
																	);
																},
																"aria-label":
																	"Remove payment mode",
																children: (0, t.jsx)(y.A, {
																	className: "h-4 w-4",
																}),
															}),
														],
													},
													e.id
												)
											),
											A
												? (0, t.jsx)("p", {
														className: "text-xs text-muted-foreground",
														children:
															"One payment entry is amended at a time. Record any other modes as new advances.",
												  })
												: (0, t.jsx)(p._, {
														onClick: () => {
															V((e) => {
																let n =
																	B.find(
																		(n) =>
																			!e.some(
																				(e) =>
																					e.mode_of_payment ===
																					n.name
																			)
																	)?.name ||
																	B[0]?.name ||
																	"";
																return [...e, j(n)];
															});
														},
														label: "Add mode",
												  }),
											(0, t.jsxs)("div", {
												className:
													"flex justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm",
												children: [
													(0, t.jsxs)("span", {
														className: "text-muted-foreground",
														children: [
															"Total downpayment",
															M.filter((e) => Number(e.amount) > 0)
																.length > 1
																? " (split)"
																: "",
														],
													}),
													(0, t.jsx)("span", {
														className: "font-medium",
														children: ed.toLocaleString(),
													}),
												],
											}),
										],
									}),
									(0, t.jsxs)("div", {
										className: "space-y-1.5",
										children: [
											(0, t.jsx)(m.J, { children: "Remarks" }),
											(0, t.jsx)(c.T, {
												rows: 2,
												value: Z,
												onChange: (e) => q(e.target.value),
												placeholder: "Optional note",
											}),
										],
									}),
								],
							}),
							(0, t.jsxs)(r.Es, {
								className: "gap-2 border-t pt-4",
								children: [
									(0, t.jsx)(o.$, {
										variant: "outline",
										onClick: () => n(!1),
										disabled: G,
										children: "Cancel",
									}),
									(0, t.jsx)(o.$, {
										onClick: ec,
										disabled: G || Q,
										children: G
											? (0, t.jsxs)(t.Fragment, {
													children: [
														(0, t.jsx)(f.A, {
															className: "mr-2 h-4 w-4 animate-spin",
														}),
														A ? "Amending…" : "Recording…",
													],
											  })
											: A
											? "Amend advance"
											: "Record advance",
									}),
								],
							}),
						],
					}),
				});
			}
		},
		94411: (e, n, a) => {
			a.d(n, {
				$X: () => h,
				BP: () => l,
				DJ: () => p,
				Jz: () => r,
				PJ: () => m,
				R0: () => i,
				WU: () => o,
				bB: () => f,
				eI: () => y,
				kT: () => d,
				wk: () => c,
			});
			var t = a(49876);
			let s = "dms.api.payment_entries";
			async function r(e) {
				return (0, t.AT)(`/api/method/${s}.get_payment_entries`, {
					method: "POST",
					body: JSON.stringify({
						status: e?.status || null,
						search: e?.search || null,
						party: e?.party || null,
						advance_only: +!!e?.advance_only,
						limit: e?.limit || 30,
						offset: e?.offset || 0,
						include_total: 1,
						posting_from: e?.posting_from || null,
						posting_to: e?.posting_to || null,
					}),
				});
			}
			async function o(e) {
				return (0, t.AT)(`/api/method/${s}.get_payment_entry_detail`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function i(e) {
				return (0, t.AT)(`/api/method/${s}.create_advance_payment`, {
					method: "POST",
					body: JSON.stringify({ data: e }),
				});
			}
			async function d(e, n) {
				return (0, t.AT)(`/api/method/${s}.get_customer_advances`, {
					method: "POST",
					body: JSON.stringify({ customer: e, company: n || null }),
				});
			}
			async function m(e) {
				return (0, t.AT)(`/api/method/${s}.cancel_payment_entry`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			async function c(e, n = !0) {
				return (0, t.AT)(`/api/method/${s}.amend_payment_entry`, {
					method: "POST",
					body: JSON.stringify({ name: e, submit: +!!n }),
				});
			}
			async function l(e) {
				return (0, t.AT)(`/api/method/${s}.delete_draft_payment_entry`, {
					method: "POST",
					body: JSON.stringify({ name: e }),
				});
			}
			let u = "dms.api.reconciliation";
			async function p(e, n) {
				return (0, t.AT)(`/api/method/${u}.get_reconciliation_overview`, {
					method: "POST",
					body: JSON.stringify({ customer: e, company: n || null }),
				});
			}
			async function h(e, n, a, s) {
				return (0, t.AT)(`/api/method/${u}.preview_allocation`, {
					method: "POST",
					body: JSON.stringify({
						customer: e,
						company: n,
						invoice_keys: a,
						payment_keys: s,
					}),
				});
			}
			async function y(e, n, a, s) {
				return (0, t.AT)(`/api/method/${u}.reconcile_payments`, {
					method: "POST",
					body: JSON.stringify({
						customer: e,
						company: n,
						invoice_keys: a,
						payment_keys: s,
					}),
				});
			}
			async function f(e, n, a) {
				return (0, t.AT)(`/api/method/${u}.reconcile_invoice_advances`, {
					method: "POST",
					body: JSON.stringify({
						sales_invoice: e,
						company: n || null,
						payment_keys: a?.length ? a : null,
					}),
				});
			}
		},
	},
]);
