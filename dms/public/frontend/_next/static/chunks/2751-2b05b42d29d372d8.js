"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[2751],
	{
		15306: (e, s, a) => {
			a.d(s, { Xi: () => c, av: () => d, j7: () => l, tU: () => n });
			var r = a(95155);
			a(12115);
			var i = a(57518),
				t = a(91337);
			function n({ className: e, ...s }) {
				return (0, r.jsx)(i.bL, {
					"data-slot": "tabs",
					className: (0, t.cn)("flex flex-col gap-2", e),
					...s,
				});
			}
			function l({ className: e, ...s }) {
				return (0, r.jsx)(i.B8, {
					"data-slot": "tabs-list",
					className: (0, t.cn)(
						"bg-muted text-muted-foreground inline-flex h-9 w-fit max-w-full items-center justify-start overflow-x-auto rounded-lg p-[3px]",
						e
					),
					...s,
				});
			}
			function c({ className: e, ...s }) {
				return (0, r.jsx)(i.l9, {
					"data-slot": "tabs-trigger",
					className: (0, t.cn)(
						"data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
						e
					),
					...s,
				});
			}
			function d({ className: e, ...s }) {
				return (0, r.jsx)(i.UC, {
					"data-slot": "tabs-content",
					className: (0, t.cn)("outline-none data-[state=inactive]:hidden", e),
					...s,
				});
			}
		},
		65588: (e, s, a) => {
			a.d(s, { _: () => i });
			var r = a(49876);
			async function i(e, s) {
				var a = await (0, r.AT)("/api/method/dms.api.quick_create.quick_create_doc", {
					method: "POST",
					body: JSON.stringify({ doctype: e, values: s }),
				});
				if (!a || "object" != typeof a) throw Error("Unexpected response from server");
				let i = a.name;
				if ("string" != typeof i || !i.trim())
					throw Error("Unexpected response from server");
				let t = a.label;
				return {
					name: i.trim(),
					label: "string" == typeof t && t.trim() ? t.trim() : void 0,
				};
			}
		},
		92751: (e, s, a) => {
			a.d(s, { Z: () => y });
			var r = a(95155),
				i = a(12115),
				t = a(6296),
				n = a(66609),
				l = a(90901),
				c = a(74350),
				d = a(4474),
				o = a(39658),
				u = a(79792),
				h = a(26518),
				m = a(15306),
				v = a(91337),
				p = a(5240),
				x = a(65588),
				g = a(71376);
			let j = [
					"Trainee",
					"Junior",
					"Intermediate",
					"Senior",
					"Master Technician",
					"EV/PHEV Certified",
					"Expert",
				],
				f = ["Standard", "Senior", "Specialist", "Warranty", "Internal", "Training"];
			function y({ doctype: e, onCreated: s, children: a, className: N, disabled: C = !1 }) {
				let { mutate: b } = (0, l.iX)(),
					[S, _] = (0, i.useState)(!1),
					[w, J] = (0, i.useState)(!1),
					[I, E] = (0, i.useState)(""),
					[T, V] = (0, i.useState)("Individual"),
					[k, q] = (0, i.useState)(""),
					[A, P] = (0, i.useState)([]),
					[X, O] = (0, i.useState)(""),
					[U, F] = (0, i.useState)(""),
					[L, G] = (0, i.useState)(""),
					[$, D] = (0, i.useState)("details"),
					[R, z] = (0, i.useState)(""),
					[B, M] = (0, i.useState)(""),
					[W, H] = (0, i.useState)(""),
					[Q, Y] = (0, i.useState)(""),
					[Z, K] = (0, i.useState)([]),
					[ee, es] = (0, i.useState)(""),
					[ea, er] = (0, i.useState)(""),
					[ei, et] = (0, i.useState)(""),
					[en, el] = (0, i.useState)(""),
					[ec, ed] = (0, i.useState)(""),
					[eo, eu] = (0, i.useState)(""),
					[eh, em] = (0, i.useState)(""),
					[ev, ep] = (0, i.useState)(""),
					[ex, eg] = (0, i.useState)(""),
					[ej, ef] = (0, i.useState)(""),
					[ey, eN] = (0, i.useState)(""),
					[eC, eb] = (0, i.useState)(""),
					[eS, e_] = (0, i.useState)(j[1]),
					[ew, eJ] = (0, i.useState)(f[0]);
				async function eI() {
					J(!0);
					try {
						let a = {};
						if ("Customer" === e) {
							if (
								((a = {
									customer_name: I,
									customer_type: T,
									customer_group: k || A[0] || "",
									mobile_no: X || void 0,
									email_id: U || void 0,
									tax_id: L || void 0,
								}),
								!I.trim())
							) {
								n.o.error("Customer name is required"), J(!1);
								return;
							}
							if (!A.length) {
								n.o.error("Configure vehicle customer groups in ERPNext first"),
									J(!1);
								return;
							}
						} else if ("Color" === e) {
							if (((a = { color_name: R }), !R.trim())) {
								n.o.error("Color name is required"), J(!1);
								return;
							}
						} else if ("Service Advisor" === e) {
							if (
								((a = { first_name: ea, last_name: ei, phone: en, email: ec }),
								!ea.trim() || !ei.trim() || !en.trim() || !ec.trim())
							) {
								n.o.error("First name, last name, phone, and email are required"),
									J(!1);
								return;
							}
						} else if ("Vehicle Service Type" === e) {
							if (
								((a = {
									service_type_name: eo,
									description: eh || void 0,
									default_estimated_hours: ev ? parseFloat(ev) : void 0,
								}),
								!eo.trim())
							) {
								n.o.error("Service type name is required"), J(!1);
								return;
							}
						} else if ("Technician" === e) {
							if (
								((a = {
									first_name: ex,
									last_name: ej,
									personal_phone: ey,
									date_of_joining: eC || void 0,
									skill_level: eS,
									labor_rate_group: ew,
								}),
								!ex.trim() || !ey.trim())
							) {
								n.o.error("First name and phone are required"), J(!1);
								return;
							}
						} else if ("Item" === e) {
							if (
								((a = {
									item_code: B,
									item_name: W,
									item_group: Q || Z[0] || "",
									brand: ee || void 0,
								}),
								!B.trim() || !W.trim())
							) {
								n.o.error("Item code and item name are required"), J(!1);
								return;
							}
							if (!Z.length) {
								n.o.error(
									"No vehicle Item Groups found — tick 'Is Vehicle' on an Item Group first"
								),
									J(!1);
								return;
							}
						}
						let r = await (0, x._)(e, a),
							i = r.label?.trim() || r.name?.trim();
						if (!r.name?.trim())
							return void n.o.error(
								"Create failed: server did not return a document name"
							);
						await b(
							(s) => {
								if ("string" == typeof s)
									return (
										("Customer" === e && "customers-paginated" === s) ||
										("Service Advisor" === e && "service-advisors" === s) ||
										("Technician" === e && "technicians" === s)
									);
								if (Array.isArray(s) && "string" == typeof s[0]) {
									let a = s[0];
									if (
										("Customer" === e &&
											("customers" === a || "customers-paginated" === a)) ||
										("Color" === e && "colors" === a) ||
										("Item" === e &&
											("vehicle-items" === a ||
												"vehicle-item-groups" === a)) ||
										("Vehicle Service Type" === e &&
											"vehicle-service-types" === a) ||
										("Technician" === e &&
											("technicians" === a || "technicians-list" === a))
									)
										return !0;
								}
								return !1;
							},
							void 0,
							{ revalidate: !0 }
						),
							s(r.name, r.label),
							n.o.success(i ? `Created: ${i}` : `Created ${e}`),
							_(!1);
					} catch (e) {
						n.o.error(e instanceof Error ? e.message : "Could not create record");
					} finally {
						J(!1);
					}
				}
				(0, i.useEffect)(() => {
					if (S) {
						if ((J(!1), "Customer" === e)) {
							E(""), V("Individual"), O(""), F(""), G(""), D("details");
							let e = !1;
							return (
								(async () => {
									try {
										let s = await (0, p.IQ)();
										if (e) return;
										P(s.groups),
											q(s.default_customer_group || s.groups[0] || "");
									} catch {
										e || (P([]), q(""));
									}
								})(),
								() => {
									e = !0;
								}
							);
						}
						if ("Item" === e) {
							M(""), H(""), es("");
							let e = !1;
							return (
								(async () => {
									try {
										let s = await (0, g.uh)();
										if (e) return;
										K(s), Y(s[0] || "");
									} catch {
										e || (K([]), Y(""));
									}
								})(),
								() => {
									e = !0;
								}
							);
						}
						"Color" === e
							? z("")
							: "Service Advisor" === e
							? (er(""), et(""), el(""), ed(""))
							: "Vehicle Service Type" === e
							? (eu(""), em(""), ep(""))
							: "Technician" === e &&
							  (eg(""), ef(""), eN(""), eb(""), e_(j[1]), eJ(f[0]));
					}
				}, [S, e]);
				let eE = (0, i.isValidElement)(a) && !!a.props?.disabled,
					eT =
						!(0, i.isValidElement)(a) || C || eE
							? (0, i.isValidElement)(a)
								? (0, i.cloneElement)(a, {
										className: (0, v.cn)(N, a.props?.className),
								  })
								: a
							: (0, i.cloneElement)(a, {
									onCreateNew: () => _(!0),
									createNewLabel: `New ${e}`,
									className: (0, v.cn)(N, a.props?.className),
							  });
				return (0, r.jsxs)(r.Fragment, {
					children: [
						eT,
						(0, r.jsx)(c.lG, {
							open: S,
							onOpenChange: _,
							children: (0, r.jsxs)(c.Cf, {
								className: "sm:max-w-md",
								children: [
									(0, r.jsxs)(c.c7, {
										children: [
											(0, r.jsx)(c.L3, {
												children: {
													Customer: "New customer",
													Color: "New color",
													Item: "New vehicle item",
													"Service Advisor": "New service advisor",
													"Vehicle Service Type":
														"New vehicle service type",
													Technician: "New technician",
												}[e],
											}),
											(0, r.jsx)(c.rr, {
												children:
													"Creates the record in ERPNext and selects it in this form.",
											}),
										],
									}),
									"Customer" === e &&
										(0, r.jsxs)(m.tU, {
											value: $,
											onValueChange: D,
											className: "py-2",
											children: [
												(0, r.jsxs)(m.j7, {
													className: "grid w-full grid-cols-2",
													children: [
														(0, r.jsx)(m.Xi, {
															value: "details",
															children: "Details",
														}),
														(0, r.jsx)(m.Xi, {
															value: "tax",
															children: "TIN No",
														}),
													],
												}),
												(0, r.jsxs)(m.av, {
													value: "details",
													className: "mt-3 grid gap-3",
													children: [
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "Customer name *",
																}),
																(0, r.jsx)(o.p, {
																	value: I,
																	onChange: (e) =>
																		E(e.target.value),
																}),
															],
														}),
														(0, r.jsxs)("div", {
															className: "grid grid-cols-2 gap-2",
															children: [
																(0, r.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, r.jsx)(u.J, {
																			children: "Type",
																		}),
																		(0, r.jsxs)(h.l6, {
																			value: T,
																			onValueChange: V,
																			children: [
																				(0, r.jsx)(h.bq, {
																					children: (0,
																					r.jsx)(
																						h.yv,
																						{}
																					),
																				}),
																				(0, r.jsxs)(h.gC, {
																					children: [
																						(0, r.jsx)(
																							h.eb,
																							{
																								value: "Individual",
																								children:
																									"Individual",
																							}
																						),
																						(0, r.jsx)(
																							h.eb,
																							{
																								value: "Company",
																								children:
																									"Company",
																							}
																						),
																					],
																				}),
																			],
																		}),
																	],
																}),
																(0, r.jsxs)("div", {
																	className: "space-y-1",
																	children: [
																		(0, r.jsx)(u.J, {
																			children:
																				"Customer group *",
																		}),
																		(0, r.jsxs)(h.l6, {
																			value: k || A[0] || "",
																			onValueChange: q,
																			disabled: !A.length,
																			children: [
																				(0, r.jsx)(h.bq, {
																					children: (0,
																					r.jsx)(h.yv, {
																						placeholder:
																							"Group",
																					}),
																				}),
																				(0, r.jsx)(h.gC, {
																					children:
																						A.map(
																							(e) =>
																								(0,
																								r.jsx)(
																									h.eb,
																									{
																										value: e,
																										children:
																											e,
																									},
																									e
																								)
																						),
																				}),
																			],
																		}),
																	],
																}),
															],
														}),
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "Mobile",
																}),
																(0, r.jsx)(o.p, {
																	value: X,
																	onChange: (e) =>
																		O(e.target.value),
																}),
															],
														}),
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "Email",
																}),
																(0, r.jsx)(o.p, {
																	type: "email",
																	value: U,
																	onChange: (e) =>
																		F(e.target.value),
																}),
															],
														}),
													],
												}),
												(0, r.jsxs)(m.av, {
													value: "tax",
													className: "mt-3 grid gap-3",
													children: [
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "TIN No",
																}),
																(0, r.jsx)(o.p, {
																	value: L,
																	onChange: (e) =>
																		G(e.target.value),
																	placeholder:
																		"e.g. XAXX010101000",
																}),
															],
														}),
														(0, r.jsx)("p", {
															className:
																"text-xs text-muted-foreground",
															children:
																"Optional. Used for invoicing and fiscal documents. You can add or update this later on the Customer record in ERPNext.",
														}),
													],
												}),
											],
										}),
									"Color" === e &&
										(0, r.jsx)("div", {
											className: "grid gap-3 py-2",
											children: (0, r.jsxs)("div", {
												className: "space-y-1",
												children: [
													(0, r.jsx)(u.J, { children: "Color name *" }),
													(0, r.jsx)(o.p, {
														value: R,
														onChange: (e) => z(e.target.value),
														placeholder: "e.g. Pearl White",
													}),
												],
											}),
										}),
									"Service Advisor" === e &&
										(0, r.jsxs)("div", {
											className: "grid gap-3 py-2",
											children: [
												(0, r.jsxs)("div", {
													className: "grid grid-cols-2 gap-2",
													children: [
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "First name *",
																}),
																(0, r.jsx)(o.p, {
																	value: ea,
																	onChange: (e) =>
																		er(e.target.value),
																}),
															],
														}),
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "Last name *",
																}),
																(0, r.jsx)(o.p, {
																	value: ei,
																	onChange: (e) =>
																		et(e.target.value),
																}),
															],
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(u.J, { children: "Phone *" }),
														(0, r.jsx)(o.p, {
															value: en,
															onChange: (e) => el(e.target.value),
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(u.J, { children: "Email *" }),
														(0, r.jsx)(o.p, {
															type: "email",
															value: ec,
															onChange: (e) => ed(e.target.value),
														}),
													],
												}),
											],
										}),
									"Vehicle Service Type" === e &&
										(0, r.jsxs)("div", {
											className: "grid gap-3 py-2",
											children: [
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(u.J, {
															children: "Service type name *",
														}),
														(0, r.jsx)(o.p, {
															value: eo,
															onChange: (e) => eu(e.target.value),
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(u.J, {
															children: "Description",
														}),
														(0, r.jsx)(o.p, {
															value: eh,
															onChange: (e) => em(e.target.value),
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(u.J, {
															children: "Default hours",
														}),
														(0, r.jsx)(o.p, {
															type: "number",
															step: "any",
															min: 0,
															value: ev,
															onChange: (e) => ep(e.target.value),
														}),
													],
												}),
											],
										}),
									"Technician" === e &&
										(0, r.jsxs)("div", {
											className: "grid gap-3 py-2",
											children: [
												(0, r.jsxs)("div", {
													className: "grid grid-cols-2 gap-2",
													children: [
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "First name *",
																}),
																(0, r.jsx)(o.p, {
																	value: ex,
																	onChange: (e) =>
																		eg(e.target.value),
																}),
															],
														}),
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "Last name",
																}),
																(0, r.jsx)(o.p, {
																	value: ej,
																	onChange: (e) =>
																		ef(e.target.value),
																}),
															],
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(u.J, {
															children: "Personal phone *",
														}),
														(0, r.jsx)(o.p, {
															value: ey,
															onChange: (e) => eN(e.target.value),
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(u.J, {
															children: "Date of joining",
														}),
														(0, r.jsx)(o.p, {
															type: "date",
															value: eC,
															onChange: (e) => eb(e.target.value),
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "grid grid-cols-2 gap-2",
													children: [
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "Skill level",
																}),
																(0, r.jsxs)(h.l6, {
																	value: eS,
																	onValueChange: e_,
																	children: [
																		(0, r.jsx)(h.bq, {
																			children: (0, r.jsx)(
																				h.yv,
																				{}
																			),
																		}),
																		(0, r.jsx)(h.gC, {
																			children: j.map((e) =>
																				(0, r.jsx)(
																					h.eb,
																					{
																						value: e,
																						children:
																							e,
																					},
																					e
																				)
																			),
																		}),
																	],
																}),
															],
														}),
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "Labor rate group",
																}),
																(0, r.jsxs)(h.l6, {
																	value: ew,
																	onValueChange: eJ,
																	children: [
																		(0, r.jsx)(h.bq, {
																			children: (0, r.jsx)(
																				h.yv,
																				{}
																			),
																		}),
																		(0, r.jsx)(h.gC, {
																			children: f.map((e) =>
																				(0, r.jsx)(
																					h.eb,
																					{
																						value: e,
																						children:
																							e,
																					},
																					e
																				)
																			),
																		}),
																	],
																}),
															],
														}),
													],
												}),
											],
										}),
									"Item" === e &&
										(0, r.jsxs)("div", {
											className: "grid gap-3 py-2",
											children: [
												(0, r.jsxs)("div", {
													className: "grid grid-cols-2 gap-2",
													children: [
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "Item code *",
																}),
																(0, r.jsx)(o.p, {
																	value: B,
																	onChange: (e) =>
																		M(e.target.value),
																	placeholder: "e.g. JETOUR-X70",
																}),
															],
														}),
														(0, r.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, r.jsx)(u.J, {
																	children: "Item name *",
																}),
																(0, r.jsx)(o.p, {
																	value: W,
																	onChange: (e) =>
																		H(e.target.value),
																	placeholder:
																		"e.g. Jetour X70 Plus",
																}),
															],
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(u.J, {
															children: "Item group *",
														}),
														(0, r.jsxs)(h.l6, {
															value: Q || Z[0] || "",
															onValueChange: Y,
															disabled: !Z.length,
															children: [
																(0, r.jsx)(h.bq, {
																	children: (0, r.jsx)(h.yv, {
																		placeholder:
																			"Vehicle item group",
																	}),
																}),
																(0, r.jsx)(h.gC, {
																	children: Z.map((e) =>
																		(0, r.jsx)(
																			h.eb,
																			{
																				value: e,
																				children: e,
																			},
																			e
																		)
																	),
																}),
															],
														}),
														(0, r.jsxs)("p", {
															className:
																"text-xs text-muted-foreground",
															children: [
																"Only Item Groups with ",
																(0, r.jsx)("b", {
																	children: "Is Vehicle",
																}),
																" ticked are listed.",
															],
														}),
													],
												}),
												(0, r.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, r.jsx)(u.J, { children: "Brand" }),
														(0, r.jsx)(o.p, {
															value: ee,
															onChange: (e) => es(e.target.value),
															placeholder: "Optional",
														}),
													],
												}),
											],
										}),
									(0, r.jsxs)(c.Es, {
										children: [
											(0, r.jsx)(d.$, {
												type: "button",
												variant: "outline",
												onClick: () => _(!1),
												children: "Cancel",
											}),
											(0, r.jsx)(d.$, {
												type: "button",
												onClick: eI,
												disabled: w,
												children: w
													? (0, r.jsx)(t.A, {
															className: "h-4 w-4 animate-spin",
													  })
													: "Create & select",
											}),
										],
									}),
								],
							}),
						}),
					],
				});
			}
		},
	},
]);
