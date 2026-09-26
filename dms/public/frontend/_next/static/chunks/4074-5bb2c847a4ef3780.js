"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
	[4074],
	{
		14636: (e, a, s) => {
			s.d(a, { A: () => t });
			let t = (0, s(90425).A)("car", [
				[
					"path",
					{
						d: "M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",
						key: "5owen",
					},
				],
				["circle", { cx: "7", cy: "17", r: "2", key: "u2ysq9" }],
				["path", { d: "M9 17h6", key: "r8uit2" }],
				["circle", { cx: "17", cy: "17", r: "2", key: "axvx0g" }],
			]);
		},
		16776: (e, a, s) => {
			s.d(a, { w: () => c });
			var t = s(95155),
				r = s(39658),
				i = s(79792),
				n = s(26518),
				l = s(88361);
			function c({
				label: e,
				mode: a,
				onModeChange: s,
				value: o,
				onValueChange: d,
				subtotal: m,
			}) {
				let u = (0, l.mW)(a, o),
					h = (0, l.HW)(m, a, u);
				return (0, t.jsxs)("div", {
					className: "rounded-lg border bg-muted/30 p-4 space-y-3",
					children: [
						(0, t.jsxs)("p", {
							className: "text-sm font-medium",
							children: [e, " discount"],
						}),
						(0, t.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: [
								(0, t.jsxs)("div", {
									className: "space-y-2",
									children: [
										(0, t.jsx)(i.J, {
											className: "text-xs",
											children: "Type",
										}),
										(0, t.jsxs)(n.l6, {
											value: a,
											onValueChange: (e) => s(e),
											children: [
												(0, t.jsx)(n.bq, {
													children: (0, t.jsx)(n.yv, {}),
												}),
												(0, t.jsxs)(n.gC, {
													children: [
														(0, t.jsx)(n.eb, {
															value: "none",
															children: "No discount",
														}),
														(0, t.jsx)(n.eb, {
															value: "percentage",
															children: "Percentage (%)",
														}),
														(0, t.jsx)(n.eb, {
															value: "amount",
															children: "Amount",
														}),
													],
												}),
											],
										}),
									],
								}),
								"none" !== a &&
									(0, t.jsxs)("div", {
										className: "space-y-2",
										children: [
											(0, t.jsx)(i.J, {
												className: "text-xs",
												children:
													"percentage" === a
														? `Percent off ${e.toLowerCase()} total`
														: `Amount off ${e.toLowerCase()} total`,
											}),
											(0, t.jsx)(r.p, {
												type: "number",
												min: 0,
												max: "percentage" === a ? 100 : m || void 0,
												step: 0.01,
												value: o,
												onChange: (e) => d(e.target.value),
												placeholder:
													"percentage" === a ? "e.g. 15" : "e.g. 500",
											}),
										],
									}),
							],
						}),
						"none" !== a &&
							h > 0 &&
							(0, t.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children:
									"percentage" === a
										? `−${h.toLocaleString()} (${u}%) off ${e.toLowerCase()}`
										: `−${h.toLocaleString()} off ${e.toLowerCase()}`,
							}),
					],
				});
			}
		},
		21749: (e, a, s) => {
			function t(e, a) {
				if (e) return a?.find((a) => a.name === e)?.full_name || void 0;
			}
			function r(e, a, s) {
				let r = (a || "").trim();
				if (r) return r;
				let i = t(e || void 0, s);
				return i || (e || "").trim();
			}
			s.d(a, { g: () => t, i: () => r });
		},
		24642: (e, a, s) => {
			s.d(a, { A: () => t });
			let t = (0, s(90425).A)("package", [
				[
					"path",
					{
						d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
						key: "1a0edw",
					},
				],
				["path", { d: "M12 22V12", key: "d0xqtd" }],
				["polyline", { points: "3.29 7 12 12 20.71 7", key: "ousv84" }],
				["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }],
			]);
		},
		57932: (e, a, s) => {
			s.r(a), s.d(a, { default: () => el });
			var t = s(95155),
				r = s(12115),
				i = s(55833),
				n = s(63360),
				l = s(36020),
				c = s(54828),
				o = s(92751),
				d = s(7425),
				m = s(6296),
				u = s(66609),
				h = s(90901),
				p = s(74350),
				v = s(4474),
				_ = s(39658),
				x = s(79792),
				g = s(84437),
				j = s(39540),
				y = s(15306),
				f = s(26518),
				b = s(10086),
				N = s(71376);
			let C = ["In Stock", "Delivered to Customer", "In Service", "In Transit"],
				w = ["Petrol", "Diesel", "Hybrid", "PHEV", "EV", "CNG", "LPG"],
				S = ["Manual (MT)", "Automatic (AT)", "CVT", "DCT", "AMT", "EV Single Speed"],
				k = ["FWD", "RWD", "AWD", "4WD"],
				L = ["km", "miles"],
				V = [
					"Inactive",
					"Active",
					"Expired by Time",
					"Expired by Mileage",
					"Void",
					"Pending Verification",
				],
				J = {
					company: "",
					vin_number: "",
					linked_item: "",
					model: "",
					plate_number: "",
					engine_number: "",
					current_customer: "",
					vehicle_status: "In Stock",
					warranty_status: "Active",
					current_odometer: "",
					odometer_unit: "km",
					brand: "",
					model_variant: "",
					model_year: "",
					fuel_type: "Petrol",
					transmission: "Automatic (AT)",
					drive_type: "FWD",
					exterior_color: "",
					interior_color: "",
					special_notes: "",
				};
			function A({
				open: e,
				onOpenChange: a,
				defaultCompany: s = "",
				defaultCustomer: i = "",
				defaultCustomerLabel: n = "",
				defaultVin: d = "",
				onCreated: I,
			}) {
				let { mutate: F } = (0, h.iX)(),
					[D, $] = (0, r.useState)(!1),
					[Z, P] = (0, r.useState)("vehicle"),
					[q, T] = (0, r.useState)(""),
					[M, E] = (0, r.useState)(""),
					[W, R] = (0, r.useState)(""),
					[B, U] = (0, r.useState)(""),
					[O, H] = (0, r.useState)(""),
					[Q, z] = (0, r.useState)(""),
					[G, X] = (0, r.useState)(""),
					[Y, K] = (0, r.useState)(""),
					[ee, ea] = (0, r.useState)(J),
					{ data: es, isLoading: et } = (0, l.Rr)(M),
					{ data: er, isLoading: ei } = (0, l.cf)(W),
					{ data: en, isLoading: el } = (0, l.iR)(B),
					{ data: ec } = (0, l.dQ)(O),
					{ data: eo, isLoading: ed } = (0, l.Ge)(Q),
					{ data: em, isLoading: eu } = (0, l.Ge)(G);
				(0, r.useEffect)(() => {
					e &&
						(ea({
							...J,
							company: s || "",
							vin_number: (d || "").toUpperCase(),
							current_customer: i || "",
							vehicle_status: i ? "Delivered to Customer" : "In Stock",
						}),
						K(n || ""),
						T(""),
						P("vehicle"),
						E(""),
						R(""),
						U(""),
						H(""),
						z(""),
						X(""));
				}, [e, s, i, n, d]);
				let eh = (0, r.useMemo)(
						() =>
							(es || []).map((e) => ({
								value: e.name,
								label: e.company_name || e.name,
							})),
						[es]
					),
					ep = (0, r.useMemo)(
						() =>
							(er || []).map((e) => ({
								value: e.name,
								label: e.item_name || e.name,
								description: e.item_code,
							})),
						[er]
					),
					ev = (0, r.useMemo)(
						() =>
							(en || []).map((e) => ({
								value: e.name,
								label: e.model_code || e.name,
								description:
									[e.model_name, e.variant].filter(Boolean).join(" ") || void 0,
							})),
						[en]
					),
					e_ = (0, r.useMemo)(
						() =>
							(0, c.b0)(
								ec,
								ee.current_customer,
								ee.current_customer
									? {
											name: ee.current_customer,
											customer_name: Y || ee.current_customer,
									  }
									: null
							),
						[ec, ee.current_customer, Y]
					),
					ex = (0, r.useMemo)(
						() => (eo || []).map((e) => ({ value: e.name, label: e.label || e.name })),
						[eo]
					),
					eg = (0, r.useMemo)(
						() => (em || []).map((e) => ({ value: e.name, label: e.label || e.name })),
						[em]
					),
					ej = (e, a) => ea((s) => ({ ...s, [e]: a })),
					ey = async (e) => {
						e.preventDefault();
						let s = ee.vin_number.trim().toUpperCase();
						if (!s) {
							T("VIN number is required"), u.o.error("VIN number is required");
							return;
						}
						if (17 !== s.length) {
							T(`VIN must be exactly 17 characters (currently ${s.length}).`),
								u.o.error("VIN / Chassis Number must be exactly 17 characters");
							return;
						}
						if (!ee.linked_item) return void u.o.error("Vehicle item is required");
						if (!ee.company) return void u.o.error("Company is required");
						$(!0);
						try {
							let e = await N.xn({
								company: ee.company,
								vin_number: s,
								linked_item: ee.linked_item,
								model: ee.model || void 0,
								plate_number: ee.plate_number.trim() || void 0,
								engine_number: ee.engine_number.trim() || void 0,
								current_customer: ee.current_customer || void 0,
								vehicle_status: ee.vehicle_status || "In Stock",
								warranty_status: ee.warranty_status || "Active",
								current_odometer: ee.current_odometer
									? parseInt(ee.current_odometer, 10)
									: void 0,
								odometer_unit: ee.odometer_unit || "km",
								brand: ee.brand.trim() || void 0,
								model_variant: ee.model_variant.trim() || void 0,
								model_year: ee.model_year ? parseInt(ee.model_year, 10) : void 0,
								fuel_type: ee.fuel_type || void 0,
								transmission: ee.transmission || void 0,
								drive_type: ee.drive_type || void 0,
								exterior_color: ee.exterior_color || void 0,
								interior_color: ee.interior_color || void 0,
								special_notes: ee.special_notes.trim() || void 0,
							});
							await F((e) => Array.isArray(e) && "vins" === e[0], void 0, {
								revalidate: !0,
							}),
								u.o.success(`Vehicle ${e.vin_number || e.name} registered`),
								I?.(e.name, e.vin_number),
								a(!1);
						} catch (e) {
							u.o.error(
								e instanceof Error ? e.message : "Could not register vehicle"
							);
						} finally {
							$(!1);
						}
					};
				return (0, t.jsx)(p.lG, {
					open: e,
					onOpenChange: a,
					children: (0, t.jsx)(p.Cf, {
						className: "max-h-[90vh] overflow-y-auto sm:max-w-2xl",
						children: (0, t.jsxs)("form", {
							onSubmit: ey,
							className: "space-y-4",
							children: [
								(0, t.jsxs)(p.c7, {
									children: [
										(0, t.jsx)(p.L3, { children: "Register new vehicle" }),
										(0, t.jsx)(p.rr, {
											children:
												"Creates the vehicle and selects it here — you stay on this screen.",
										}),
									],
								}),
								(0, t.jsxs)(y.tU, {
									value: Z,
									onValueChange: P,
									className: "gap-3",
									children: [
										(0, t.jsxs)(y.j7, {
											className: "bg-muted/50 w-full justify-start",
											children: [
												(0, t.jsx)(y.Xi, {
													value: "vehicle",
													children: "Vehicle & Customer",
												}),
												(0, t.jsx)(y.Xi, {
													value: "specs",
													children: "Specifications",
												}),
											],
										}),
										(0, t.jsxs)(y.av, {
											value: "vehicle",
											className: "space-y-3",
											children: [
												(0, t.jsxs)("div", {
													className: "grid grid-cols-2 gap-3",
													children: [
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "VIN Number *",
																}),
																(0, t.jsx)(_.p, {
																	value: ee.vin_number,
																	onChange: (e) => {
																		T(""),
																			ej(
																				"vin_number",
																				e.target.value.toUpperCase()
																			);
																	},
																	placeholder:
																		"17-character VIN",
																	maxLength: 17,
																	"aria-invalid": !!q,
																	className: q
																		? "border-destructive focus-visible:ring-destructive/30"
																		: void 0,
																	autoFocus: !0,
																}),
																(0, t.jsx)("p", {
																	className: `text-xs ${
																		q
																			? "text-destructive"
																			: "text-muted-foreground"
																	}`,
																	children:
																		q ||
																		`${
																			ee.vin_number.trim()
																				.length
																		}/17 characters`,
																}),
															],
														}),
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Company *",
																}),
																(0, t.jsx)(b.Zi, {
																	options: eh,
																	value: ee.company,
																	onValueChange: (e) =>
																		ej("company", e),
																	onSearchChange: E,
																	placeholder:
																		"Select company...",
																	isLoading: et,
																	portaled: !0,
																}),
															],
														}),
													],
												}),
												(0, t.jsxs)("div", {
													className: "grid grid-cols-2 gap-3",
													children: [
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Vehicle Item *",
																}),
																(0, t.jsx)(b.Zi, {
																	options: ep,
																	value: ee.linked_item,
																	onValueChange: (e) =>
																		ej("linked_item", e),
																	onSearchChange: R,
																	placeholder:
																		"Search vehicle item...",
																	isLoading: ei,
																	portaled: !0,
																}),
															],
														}),
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Vehicle Model",
																}),
																(0, t.jsx)(b.Zi, {
																	options: ev,
																	value: ee.model,
																	onValueChange: (e) =>
																		ej("model", e),
																	onSearchChange: U,
																	placeholder:
																		"Search vehicle models...",
																	isLoading: el,
																	portaled: !0,
																}),
															],
														}),
													],
												}),
												(0, t.jsxs)("div", {
													className: "grid grid-cols-2 gap-3",
													children: [
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "License plate",
																}),
																(0, t.jsx)(_.p, {
																	value: ee.plate_number,
																	onChange: (e) =>
																		ej(
																			"plate_number",
																			e.target.value.toUpperCase()
																		),
																}),
															],
														}),
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Engine number",
																}),
																(0, t.jsx)(_.p, {
																	value: ee.engine_number,
																	onChange: (e) =>
																		ej(
																			"engine_number",
																			e.target.value
																		),
																}),
															],
														}),
													],
												}),
												(0, t.jsxs)("div", {
													className: "grid grid-cols-2 gap-3",
													children: [
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Customer",
																}),
																(0, t.jsx)(o.Z, {
																	doctype: "Customer",
																	onCreated: (e, a) => {
																		ej("current_customer", e),
																			K(a || e);
																	},
																	children: (0, t.jsx)(b.Zi, {
																		options: e_,
																		value: ee.current_customer,
																		valueLabel: Y,
																		onValueChange: (e) => {
																			let a = ec?.find(
																				(a) => a.name === e
																			);
																			ej(
																				"current_customer",
																				e
																			),
																				K(
																					a?.customer_name ||
																						""
																				);
																		},
																		onSearchChange: H,
																		placeholder:
																			"Search customers...",
																		portaled: !0,
																	}),
																}),
															],
														}),
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Vehicle status",
																}),
																(0, t.jsxs)(f.l6, {
																	value: ee.vehicle_status,
																	onValueChange: (e) =>
																		ej("vehicle_status", e),
																	children: [
																		(0, t.jsx)(f.bq, {
																			children: (0, t.jsx)(
																				f.yv,
																				{}
																			),
																		}),
																		(0, t.jsx)(f.gC, {
																			children: C.map((e) =>
																				(0, t.jsx)(
																					f.eb,
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
												(0, t.jsxs)("div", {
													className: "grid grid-cols-2 gap-3",
													children: [
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Current odometer",
																}),
																(0, t.jsxs)("div", {
																	className: "flex gap-2",
																	children: [
																		(0, t.jsx)(_.p, {
																			type: "number",
																			min: 0,
																			placeholder: "0",
																			value: ee.current_odometer,
																			onChange: (e) =>
																				ej(
																					"current_odometer",
																					e.target.value
																				),
																			className: "flex-1",
																		}),
																		(0, t.jsxs)(f.l6, {
																			value: ee.odometer_unit,
																			onValueChange: (e) =>
																				ej(
																					"odometer_unit",
																					e
																				),
																			children: [
																				(0, t.jsx)(f.bq, {
																					className:
																						"w-24",
																					children: (0,
																					t.jsx)(
																						f.yv,
																						{}
																					),
																				}),
																				(0, t.jsx)(f.gC, {
																					children:
																						L.map(
																							(e) =>
																								(0,
																								t.jsx)(
																									f.eb,
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
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Warranty status",
																}),
																(0, t.jsxs)(f.l6, {
																	value: ee.warranty_status,
																	onValueChange: (e) =>
																		ej("warranty_status", e),
																	children: [
																		(0, t.jsx)(f.bq, {
																			children: (0, t.jsx)(
																				f.yv,
																				{}
																			),
																		}),
																		(0, t.jsx)(f.gC, {
																			children: V.map((e) =>
																				(0, t.jsx)(
																					f.eb,
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
												(0, t.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [
														(0, t.jsx)(g.S, {
															id: "vehicle-warranty-active",
															checked:
																"Active" === ee.warranty_status,
															onCheckedChange: (e) =>
																ej(
																	"warranty_status",
																	!0 === e
																		? "Active"
																		: "Inactive"
																),
														}),
														(0, t.jsx)(x.J, {
															htmlFor: "vehicle-warranty-active",
															className: "cursor-pointer",
															children: "Warranty active",
														}),
														(0, t.jsx)("span", {
															className:
																"text-xs text-muted-foreground",
															children:
																"— quick Active / Inactive switch",
														}),
													],
												}),
											],
										}),
										(0, t.jsxs)(y.av, {
											value: "specs",
											className: "space-y-3",
											children: [
												(0, t.jsxs)("div", {
													className: "grid grid-cols-2 gap-2",
													children: [
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Brand",
																}),
																(0, t.jsx)(_.p, {
																	value: ee.brand,
																	onChange: (e) =>
																		ej(
																			"brand",
																			e.target.value
																		),
																}),
															],
														}),
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Model variant",
																}),
																(0, t.jsx)(_.p, {
																	value: ee.model_variant,
																	onChange: (e) =>
																		ej(
																			"model_variant",
																			e.target.value
																		),
																}),
															],
														}),
													],
												}),
												(0, t.jsxs)("div", {
													className: "grid grid-cols-2 gap-2",
													children: [
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Model year",
																}),
																(0, t.jsx)(_.p, {
																	type: "number",
																	placeholder: "e.g. 2024",
																	value: ee.model_year,
																	onChange: (e) =>
																		ej(
																			"model_year",
																			e.target.value
																		),
																}),
															],
														}),
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Fuel type",
																}),
																(0, t.jsxs)(f.l6, {
																	value: ee.fuel_type,
																	onValueChange: (e) =>
																		ej("fuel_type", e),
																	children: [
																		(0, t.jsx)(f.bq, {
																			children: (0, t.jsx)(
																				f.yv,
																				{}
																			),
																		}),
																		(0, t.jsx)(f.gC, {
																			children: w.map((e) =>
																				(0, t.jsx)(
																					f.eb,
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
												(0, t.jsxs)("div", {
													className: "grid grid-cols-2 gap-2",
													children: [
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Transmission",
																}),
																(0, t.jsxs)(f.l6, {
																	value: ee.transmission,
																	onValueChange: (e) =>
																		ej("transmission", e),
																	children: [
																		(0, t.jsx)(f.bq, {
																			children: (0, t.jsx)(
																				f.yv,
																				{}
																			),
																		}),
																		(0, t.jsx)(f.gC, {
																			children: S.map((e) =>
																				(0, t.jsx)(
																					f.eb,
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
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Drive type",
																}),
																(0, t.jsxs)(f.l6, {
																	value: ee.drive_type,
																	onValueChange: (e) =>
																		ej("drive_type", e),
																	children: [
																		(0, t.jsx)(f.bq, {
																			children: (0, t.jsx)(
																				f.yv,
																				{}
																			),
																		}),
																		(0, t.jsx)(f.gC, {
																			children: k.map((e) =>
																				(0, t.jsx)(
																					f.eb,
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
												(0, t.jsxs)("div", {
													className: "grid grid-cols-2 gap-2",
													children: [
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Exterior color",
																}),
																(0, t.jsx)(b.Zi, {
																	options: ex,
																	value: ee.exterior_color,
																	onValueChange: (e) =>
																		ej("exterior_color", e),
																	onSearchChange: z,
																	placeholder: "Search color...",
																	isLoading: ed,
																	portaled: !0,
																}),
															],
														}),
														(0, t.jsxs)("div", {
															className: "space-y-1",
															children: [
																(0, t.jsx)(x.J, {
																	children: "Interior color",
																}),
																(0, t.jsx)(b.Zi, {
																	options: eg,
																	value: ee.interior_color,
																	onValueChange: (e) =>
																		ej("interior_color", e),
																	onSearchChange: X,
																	placeholder: "Search color...",
																	isLoading: eu,
																	portaled: !0,
																}),
															],
														}),
													],
												}),
												(0, t.jsxs)("div", {
													className: "space-y-1",
													children: [
														(0, t.jsx)(x.J, {
															children: "Special notes",
														}),
														(0, t.jsx)(j.T, {
															rows: 3,
															placeholder:
																"Any special notes about this vehicle...",
															value: ee.special_notes,
															onChange: (e) =>
																ej(
																	"special_notes",
																	e.target.value
																),
														}),
													],
												}),
											],
										}),
									],
								}),
								(0, t.jsxs)(p.Es, {
									children: [
										(0, t.jsx)(v.$, {
											type: "button",
											variant: "outline",
											onClick: () => a(!1),
											disabled: D,
											children: "Cancel",
										}),
										(0, t.jsxs)(v.$, {
											type: "submit",
											disabled: D,
											children: [
												D
													? (0, t.jsx)(m.A, {
															className: "mr-2 h-4 w-4 animate-spin",
													  })
													: null,
												"Register vehicle",
											],
										}),
									],
								}),
							],
						}),
					}),
				});
			}
			var I = s(42074),
				F = s(5240),
				D = s(67911),
				$ = s(16258),
				Z = s(2412),
				P = s(44416),
				q = s(21749),
				T = s(29158),
				M = s(52959),
				E = s(95964),
				W = s(79984),
				R = s(61991),
				B = s(80723),
				U = s(32967),
				O = s(14636),
				H = s(42869),
				Q = s(68459),
				z = s(24642),
				G = s(55243),
				X = s(16776),
				Y = s(88361),
				K = s(58979),
				ee = s(58496),
				ea = s(15664);
			let es = [
					"Customer Paid",
					"Warranty",
					"Internal",
					"PDI",
					"Campaign/Recall",
					"Insurance",
					"Goodwill",
					"Fleet Contract",
				],
				et = [
					"Normal",
					"VIP",
					"Comeback/Repeat Repair",
					"Safety Critical",
					"Immobilized",
					"Fleet Priority",
					"Emergency",
					"Urgent",
				];
			function er() {
				return {
					complaint_description: "",
					symptom_category: T.d9,
					severity: T.c6,
					labor_operation: "",
				};
			}
			function ei() {
				return {
					vehicle_service_item: "",
					vehicle_service_item_name: "",
					display_name: "",
					technician: "",
					technician_name: "",
					estimated_hours: 0,
					rate_per_hour: 0,
					complaint: "",
				};
			}
			function en(e) {
				return {
					item_code: "",
					item_name: "",
					quantity_requested: 1,
					unit_price: 0,
					warehouse: e || void 0,
				};
			}
			function el() {
				let { navigate: e, viewParams: a } = (0, i.c)(),
					{ canEditPrice: s } = (0, n.Sk)(),
					h = a.get("id") || "",
					[p, y] = (0, r.useState)(h),
					[C, w] = (0, r.useState)(""),
					{ trigger: S, isMutating: k } = (0, l.r9)(),
					[L, V] = (0, r.useState)(!1),
					J = k || L,
					{ data: el, isLoading: ec } = (0, l.pw)(h || null);
				(0, r.useEffect)(() => {
					h && h !== p && (y(h), w(""));
				}, [h, p]);
				let [eo, ed] = (0, r.useState)(""),
					[em, eu] = (0, r.useState)(""),
					[eh, ep] = (0, r.useState)(""),
					[ev, e_] = (0, r.useState)(""),
					[ex, eg] = (0, r.useState)(""),
					[ej, ey] = (0, r.useState)(""),
					[ef, eb] = (0, r.useState)(""),
					[eN, eC] = (0, r.useState)("ETB"),
					[ew, eS] = (0, r.useState)(""),
					[ek, eL] = (0, r.useState)(""),
					[eV, eJ] = (0, r.useState)(""),
					[eA, eI] = (0, r.useState)(null),
					[eF, eD] = (0, r.useState)(!1),
					e$ = eA?.model || eA?.resolved_vehicle_model || void 0,
					{ data: eZ, isLoading: eP } = (0, l.dQ)(eo),
					{ data: eq, isLoading: eT } = (0, l.qp)(),
					{ data: eM, isLoading: eE } = (0, l.Up)(),
					{ data: eW, isLoading: eR } = (0, l.jm)(),
					{ data: eB, isLoading: eU } = (0, l.oA)(),
					{ data: eO, isLoading: eH } = (0, l.Sg)(eh, e$, eV || void 0),
					{ data: eQ, isLoading: ez } = (0, l.hF)(
						ev,
						void 0,
						ef || void 0,
						e$,
						eV || void 0
					),
					{ data: eG, isLoading: eX } = (0, l.Uj)(ex, ef || void 0),
					{ data: eY, isLoading: eK } = (0, l.Rr)(ej),
					{ data: e0 } = (0, l.Ms)(),
					{ data: e1 } = (0, l.ZN)();
				(0, l.Tr)(
					eY,
					eK,
					ef,
					(e) => {
						eb(e.name), eS(""), eg(""), e.default_currency && eC(e.default_currency);
					},
					{ search: ej }
				);
				let [e2, e4] = (0, r.useState)(""),
					[e6, e3] = (0, r.useState)("Normal"),
					[e5, e9] = (0, r.useState)(0),
					[e7, e8] = (0, r.useState)(""),
					[ae, aa] = (0, r.useState)(""),
					[as, at] = (0, r.useState)(!1),
					ar = (0, r.useRef)(null),
					[ai, an] = (0, r.useState)(!1),
					[al, ac] = (0, r.useState)(!1),
					[ao, ad] = (0, r.useState)(null);
				(0, l.Zf)(
					ek,
					(e) => {
						eL(e.default_customer),
							ad({
								name: e.default_customer,
								customer_name: e.customer_name || e.default_customer,
								mobile_no: e.mobile_no || void 0,
							});
					},
					{ enabled: !p }
				);
				let [am, au] = (0, r.useState)(""),
					[ah, ap] = (0, r.useState)(0),
					[av, a_] = (0, r.useState)(""),
					[ax, ag] = (0, r.useState)(null),
					[aj, ay] = (0, r.useState)(""),
					[af, ab] = (0, r.useState)(""),
					[aN, aC] = (0, r.useState)(""),
					[aw, aS] = (0, r.useState)(""),
					[ak, aL] = (0, r.useState)(""),
					[aV, aJ] = (0, r.useState)(() => {
						let e = new Date(),
							a = (e) => String(e).padStart(2, "0");
						return `${e.getFullYear()}-${a(e.getMonth() + 1)}-${a(e.getDate())}`;
					}),
					[aA, aI] = (0, r.useState)("none"),
					[aF, aD] = (0, r.useState)(""),
					[a$, aZ] = (0, r.useState)("none"),
					[aP, aq] = (0, r.useState)(""),
					aT = (0, r.useRef)(null),
					[aM, aE] = (0, r.useState)(""),
					[aW, aR] = (0, r.useState)(""),
					[aB, aU] = (0, r.useState)(""),
					[aO, aH] = (0, r.useState)(""),
					[aQ, az] = (0, r.useState)(""),
					[aG, aX] = (0, r.useState)(a.get("appointment") || ""),
					[aY, aK] = (0, r.useState)(a.get("inspection") || ""),
					[a0, a1] = (0, r.useState)(!1),
					[a2, a4] = (0, r.useState)(!1),
					a6 = (0, r.useRef)(null),
					{ data: a3 } = (0, l.tR)({ customer: ek || void 0 }),
					{ data: a5, isLoading: a9 } = (0, l.mv)(void 0, em),
					{ data: a7, isLoading: a8 } = (0, l.OF)(eV || null, e$),
					[se, sa] = (0, r.useState)([er()]),
					[ss, st] = (0, r.useState)([ei()]),
					[sr, si] = (0, r.useState)([en()]),
					[sn, sl] = (0, r.useState)(0),
					[sc, so] = (0, r.useState)(0);
				(0, r.useEffect)(() => {
					ew && si((e) => e.map((e) => ({ ...e, warehouse: ew })));
				}, [ew]),
					(0, r.useEffect)(() => {
						if (aO) return;
						let e = eM?.find((e) => !!e.is_default);
						e?.name && (aH(e.name), az((0, P.i)(e.terms_and_conditions || "")));
					}, [eM, aO]);
				let sd = (e) => {
						eI(e),
							au(e.plate_number || ""),
							ap(e.current_odometer || 0),
							a_(e.warranty_status || ""),
							ag(null),
							e.current_customer &&
								(eL(e.current_customer),
								ad({
									name: e.current_customer,
									customer_name: e.customer_name || e.current_customer,
								}));
					},
					sm = async (e) => {
						if ((eJ(e), aa(""), ag(null), !e)) {
							eI(null), a_("");
							return;
						}
						let a = a5?.find((a) => a.name === e);
						a && sd(a);
						try {
							let a = await N.Dh(e);
							sd({
								name: a.name,
								vin_number: a.vin_number,
								plate_number: a.plate_number,
								model: a.model,
								model_name: a.model_name,
								resolved_vehicle_model: a.resolved_vehicle_model,
								current_customer: a.current_customer,
								customer_name: a.customer_name,
								current_odometer: a.current_odometer,
								warranty_status: a.warranty_status,
								linked_item: a.linked_item,
								model_year: a.model_year,
								warranty_end_date: a.warranty_end_date,
							}),
								a_(a.warranty_status || ""),
								ag(a.warranty_summary || null);
						} catch {
							a || u.o.error("Could not load vehicle details for the selected VIN");
						}
					},
					su = (0, r.useMemo)(() => (0, c.b0)(eZ, ek, ao), [eZ, ek, ao]),
					sh = (0, r.useMemo)(() => {
						let e =
							a5?.map((e) => ({
								value: e.name,
								label: e.vin_number,
								description: [e.model_name, e.plate_number, e.customer_name]
									.filter(Boolean)
									.join(" \xb7 "),
							})) || [];
						return eV && eA && !e.some((e) => e.value === eV)
							? [
									{
										value: eA.name,
										label: eA.vin_number,
										description: [eA.model_name, eA.plate_number]
											.filter(Boolean)
											.join(" \xb7 "),
									},
									...e,
							  ]
							: e;
					}, [a5, eV, eA]),
					sp = async (e) => {
						if ((aC(e), !e)) return void aS("");
						try {
							let a = await (0, F.Z9)(e),
								s = a?.workshop || a?.branch;
							s && aS(s), a?.warehouse && eS(a.warehouse);
						} catch {}
					},
					sv = async (e, a) => {
						if (!a) return void st((a) => a.map((a, s) => (s === e ? ei() : a)));
						let s = eO?.find((e) => e.name === a),
							t = s?.custom_rate || 0,
							r = (0, F.mW)(s),
							i = (0, F.sJ)(s) || a;
						try {
							let e = await (0, F.J$)(a);
							e.estimated_hours > 0 && (r = e.estimated_hours),
								e.rate_per_hour > 0 && (t = e.rate_per_hour),
								(e.service_name || e.service_code) &&
									(i = e.service_code
										? `${e.service_code}: ${e.service_name || a}`
										: e.service_name || i);
						} catch {
							if (!t)
								try {
									t = await (0, F.Mo)(a);
								} catch {}
						}
						st((s) =>
							s.map((s, n) =>
								n === e
									? {
											...s,
											vehicle_service_item: a,
											vehicle_service_item_name: i,
											display_name: i,
											estimated_hours: r,
											rate_per_hour: t || s.rate_per_hour,
									  }
									: s
							)
						);
					},
					s_ = async (e, a) => {
						let s = eQ?.find((e) => e.name === a);
						if (!a)
							return void si((a) =>
								a.map((a, s) =>
									s === e
										? {
												...a,
												item_code: "",
												item_name: "",
												bin_location: void 0,
												unit_price: 0,
										  }
										: a
								)
							);
						let t = 0;
						try {
							t = await (0, F.QF)(a);
						} catch (e) {
							console.error("[DMS] fetchSparePartPrice failed", {
								sparePart: a,
								err: e,
							}),
								u.o.error(
									e instanceof Error
										? e.message
										: "Could not load spare part unit price"
								);
						}
						si((r) =>
							r.map((r, i) =>
								i === e
									? {
											...r,
											item_code: a,
											item_name: s?.item_name || a,
											bin_location: s?.bin_location,
											unit_price: t,
									  }
									: r
							)
						);
					},
					sx = (e, a) => {
						sa((s) => s.map((s, t) => (t === e ? { ...s, ...a } : s)));
					},
					sg = (e, a) => {
						st((s) => s.map((s, t) => (t === e ? { ...s, ...a } : s)));
					},
					sj = (e, a) => {
						si((s) => s.map((s, t) => (t === e ? { ...s, ...a } : s)));
					},
					sy = (0, r.useCallback)(
						async (e) => {
							at(!0);
							try {
								let a = await (0, $.L)(e, { vin: eV || void 0, vehicleModel: e$ }),
									s = eW?.find((e) => e.name === af)?.full_name || af || "";
								st(
									a.labour.length
										? a.labour.map((e) => ({
												vehicle_service_item: e.vehicle_service_item,
												vehicle_service_item_name: e.service_code
													? `${e.service_code}: ${
															e.service_name ||
															e.vehicle_service_item
													  }`
													: e.service_name || e.vehicle_service_item,
												display_name: e.service_code
													? `${e.service_code}: ${
															e.service_name ||
															e.vehicle_service_item
													  }`
													: e.service_name || e.vehicle_service_item,
												technician: af || "",
												technician_name: s,
												estimated_hours: e.estimated_hours,
												rate_per_hour: e.rate_per_hour,
												complaint: e.notes || "",
										  }))
										: [ei()]
								),
									si(
										a.parts.length
											? a.parts.map((e) => ({
													item_code: e.item_code,
													item_name: e.item_name || e.item_code,
													bin_location: e.bin_location,
													quantity_requested: e.quantity_requested,
													unit_price: e.unit_price,
													warehouse: ew || void 0,
											  }))
											: [en(ew)]
									);
								let t = a.package_name || e;
								u.o.success(
									`Loaded "${t}": ${a.labour.length} labour, ${a.parts.length} parts`
								),
									(a.labour_discount_amount || 0) > 0 &&
										(aI("amount"), aD(String(a.labour_discount_amount)));
								let r = a.labour.reduce((e, a) => e + (a.estimated_hours || 0), 0);
								r > 0 && e9(Math.round(10 * r) / 10);
							} catch (e) {
								(ar.current = null),
									u.o.error(
										e instanceof Error
											? e.message
											: "Could not load service package"
									);
							} finally {
								at(!1);
							}
						},
						[af, eW, ew, eV, e$]
					);
				(0, r.useEffect)(() => {
					let e = a.get("inspection") || "";
					e && e !== aY && aK(e);
					let s = a.get("appointment") || "";
					s && s !== aG && aX(s);
				}, [a, aY, aG]);
				let sf = (0, r.useCallback)(
					async (e) => {
						a4(!0);
						try {
							let a = await (0, Z.Z4)(e);
							if (a.company) {
								eb(a.company);
								let e = eY?.find((e) => e.name === a.company);
								e?.default_currency && eC(e.default_currency);
							}
							if (
								(a.service_advisor && ay(a.service_advisor),
								a.appointment && aX(a.appointment),
								a.customer &&
									(eL(a.customer),
									ad({
										name: a.customer,
										customer_name: a.customer_name || a.customer,
									})),
								a.vin_chassis)
							) {
								eJ(a.vin_chassis);
								try {
									let e = await N.Dh(a.vin_chassis);
									sd({
										name: e.name,
										vin_number: e.vin_number,
										plate_number: e.plate_number,
										model: e.model,
										model_name: e.model_name,
										current_customer: e.current_customer,
										customer_name: e.customer_name,
										current_odometer: e.current_odometer,
										warranty_status: e.warranty_status,
										linked_item: e.linked_item,
										model_year: e.model_year,
										warranty_end_date: e.warranty_end_date,
									}),
										a_(e.warranty_status || ""),
										ag(e.warranty_summary || null);
								} catch {
									u.o.error(
										"Could not load vehicle details from the inspection"
									);
								}
							}
							a.license_plate && au(a.license_plate),
								null != a.odometer && ap(a.odometer);
							let s = (a.customer_complaints || [])
								.map((e) => ({
									complaint_description: (0, P.i)(
										e.customer_exact_words || e.complaint || ""
									),
									symptom_category: e.symptom_category || e.category || T.d9,
									severity: e.severity || T.c6,
									labor_operation: "",
								}))
								.filter((e) => e.complaint_description);
							s.length
								? (sa(s), aE(s.map((e) => e.complaint_description).join("\n\n")))
								: (sa([er()]),
								  aE(""),
								  u.o.info("This inspection has no customer complaint rows"));
							let t = (0, P.i)(a.service_advisor_notes || "");
							t && aR(t);
							let r = (0, P.i)(a.internal_notes || "");
							r && aU(r);
						} catch (e) {
							(a6.current = null),
								u.o.error(
									e instanceof Error
										? e.message
										: "Could not load complaints from inspection"
								);
						} finally {
							a4(!1);
						}
					},
					[eY]
				);
				(0, r.useEffect)(() => {
					if (!p) {
						if (!aY) {
							a6.current = null;
							return;
						}
						a6.current !== aY && ((a6.current = aY), sf(aY));
					}
				}, [aY, sf, p]),
					(0, r.useEffect)(() => {
						if (!h || !el || C === h) return;
						if ("Draft" !== el.status) {
							u.o.error("Only draft job cards can be continued here"),
								e("job-card-detail", { id: h });
							return;
						}
						y(el.name),
							e4(el.job_card_type || ""),
							e3(el.priority || "Normal"),
							e9(Number(el.estimated_duration_hours) || 0),
							e8(
								el.promised_delivery_date_time
									? String(el.promised_delivery_date_time)
											.replace(" ", "T")
											.slice(0, 16)
									: ""
							),
							eb(el.company || ""),
							eC(el.currency || "ETB"),
							eS(el.warehouse || ""),
							aS(el.workshop || ""),
							aJ(el.posting_date ? String(el.posting_date).slice(0, 10) : aV),
							el.customer &&
								(eL(el.customer),
								ad({
									name: el.customer,
									customer_name: el.customer_name || el.customer,
									mobile_no: el.customer_mobile,
								})),
							au(el.license_plate || ""),
							ap(Number(el.current_odometer) || 0),
							a_(el.warranty_status || ""),
							aL(el.warranty_application_type || ""),
							ay(el.service_advisor || ""),
							ab(el.lead_technician || ""),
							aC(el.assigned_bay || ""),
							aR(el.service_advisor_notes || ""),
							aU(el.internal_notes || ""),
							aH(el.terms || ""),
							az((0, P.i)(el.terms_and_conditions || "")),
							aX(el.appointment || ""),
							aK(el.inspection || ""),
							a1(!!el.skip_vehicle_inspection),
							(a6.current = el.inspection || null),
							el.labour_discount_type &&
								Number(el.labour_discount_value) > 0 &&
								(aI(
									"Percentage" === el.labour_discount_type
										? "percentage"
										: "amount"
								),
								aD(String(el.labour_discount_value))),
							el.parts_discount_type &&
								Number(el.parts_discount_value) > 0 &&
								(aZ(
									"Percentage" === el.parts_discount_type
										? "percentage"
										: "amount"
								),
								aq(String(el.parts_discount_value)));
						let a = (el.job_items || [])
							.map((e) => ({
								complaint_description:
									e.complaint_description || e.complaint || "",
								symptom_category: e.symptom_category || T.d9,
								severity: e.severity || T.c6,
								labor_operation: e.labor_operation || "",
							}))
							.filter((e) => e.complaint_description);
						sa(a.length ? a : [er()]),
							aE(a.map((e) => e.complaint_description).join("\n\n"));
						let s = (el.labour || [])
							.filter((e) => e.vehicle_service_item)
							.map((e) => ({
								vehicle_service_item: e.vehicle_service_item || "",
								vehicle_service_item_name: e.service_name || "",
								display_name:
									e.custom_display_name ||
									e.display_name ||
									e.service_name ||
									"",
								technician: e.technician || "",
								technician_name: e.technician_name || "",
								estimated_hours: Number(e.estimated_hours) || 0,
								rate_per_hour: Number(e.rate_per_hour ?? e.rate) || 0,
								complaint: e.complaint || "",
							}));
						st(s.length ? s : [ei()]);
						let t = (el.parts || [])
							.filter((e) => e.item_code || e.part_code)
							.map((e) => ({
								item_code: e.item_code || e.part_code || "",
								item_name: e.part_name || "",
								bin_location: e.bin_location || "",
								quantity_requested:
									Number(e.quantity_requested ?? e.quantity) || 1,
								unit_price: Number(e.unit_price) || 0,
								warehouse: e.warehouse || el.warehouse || void 0,
							}));
						si(t.length ? t : [en(el.warehouse || void 0)]),
							(async () => {
								if (!el.vehicle_vin) return w(h);
								eJ(el.vehicle_vin);
								try {
									let e = await N.Dh(el.vehicle_vin);
									sd({
										name: e.name,
										vin_number: e.vin_number,
										plate_number: e.plate_number || el.license_plate,
										model: e.model,
										model_name: e.model_name,
										current_customer: e.current_customer || el.customer,
										customer_name: e.customer_name || el.customer_name,
										current_odometer:
											el.current_odometer ?? e.current_odometer,
										warranty_status: e.warranty_status || el.warranty_status,
										linked_item: e.linked_item,
										model_year: e.model_year,
										warranty_end_date: e.warranty_end_date,
									}),
										ag(e.warranty_summary || null);
								} catch {
									eI({
										name: el.vehicle_vin,
										vin_number: el.vin_number || el.vehicle_vin,
										plate_number: el.license_plate,
										model_name: el.vehicle_model,
										current_customer: el.customer,
										customer_name: el.customer_name,
										current_odometer: el.current_odometer,
										warranty_status: el.warranty_status,
									});
								}
								w(h);
							})();
					}, [h, el, C]),
					(0, r.useEffect)(() => {
						if (!eV || !ae) {
							ae || (ar.current = null);
							return;
						}
						ar.current !== ae && ((ar.current = ae), sy(ae));
					}, [eV, ae, sy]);
				let sb = (0, r.useMemo)(() => {
						let e = a3?.data || [];
						if (eV) {
							let a = e.filter((e) => e.customer_vehicle === eV);
							a.length && (e = a);
						}
						return e.map((e) => ({
							value: e.name,
							label: e.name,
							description: [e.customer_vehicle || e.vin_chassis, e.customer]
								.filter(Boolean)
								.join(" \xb7 "),
						}));
					}, [a3, eV]),
					sN = (0, r.useMemo)(
						() =>
							a7?.packages?.map((e) => ({
								value: e.name,
								label: e.package_id
									? `${e.package_id} — ${e.description || e.package_name}`
									: e.description || e.package_name,
								description: [
									e.total_amount
										? `Total ${e.total_amount.toLocaleString()}`
										: null,
									e.before_discount &&
									e.after_discount &&
									e.before_discount !== e.after_discount
										? `Before ${e.before_discount.toLocaleString()} → After ${e.after_discount.toLocaleString()}`
										: null,
									e.interval_km ? `${e.interval_km.toLocaleString()} km` : null,
									e.interval_months ? `${e.interval_months} mo` : null,
									e.total_labor_hours ? `${e.total_labor_hours}h labour` : null,
								]
									.filter(Boolean)
									.join(" \xb7 "),
							})) || [],
						[a7]
					);
				(0, r.useEffect)(() => {
					ae &&
						sN.length > 0 &&
						!sN.some((e) => e.value === ae) &&
						(aa(""), (ar.current = null));
				}, [sN, ae]);
				let sC = ss.filter((e) => e.vehicle_service_item),
					sw = sr.filter((e) => e.item_code),
					sS = se.filter((e) => (e.complaint_description || "").trim()),
					sk = sC.reduce((e, a) => e + a.estimated_hours * a.rate_per_hour, 0),
					sL = sw.reduce((e, a) => e + a.quantity_requested * a.unit_price, 0),
					sV = sk + sL,
					sJ = (0, Y.mW)(aA, aF),
					sA = (0, Y.mW)(a$, aP),
					sI = (0, Y.HW)(sk, aA, sJ),
					sF = (0, Y.HW)(sL, a$, sA),
					sD = sI + sF,
					s$ =
						"All Invoice" === ak
							? 0
							: "Spare Part" === ak
							? sk
							: "Labour" === ak
							? sL
							: "Discount" === ak
							? Math.max(sV - sD, 0)
							: sV,
					sZ = async (a) => {
						let s = "draft" === a;
						if (!e2) return void u.o.error("Please select a job card type");
						if (!ek && !eV)
							return void u.o.error(
								s
									? "Select at least a customer or vehicle before saving a draft"
									: "Please select a customer"
							);
						if (!s && !ek) return void u.o.error("Please select a customer");
						if (!s && !eV) return void u.o.error("Please select a vehicle VIN");
						if (!s && "Internal" !== e2 && !a0 && !aY)
							return void u.o.error("Please select a vehicle inspection");
						if (!s && "Internal" === e2) {
							if (!aj)
								return void u.o.error(
									"Service advisor is required for internal job cards"
								);
							if (!af)
								return void u.o.error(
									"Lead technician is required to start repair"
								);
						}
						if (!s && 0 === sS.length)
							return void u.o.error("Please add at least one job item");
						if (!s && "Discount" === ak) {
							if (sD < 1)
								return void u.o.error(
									"Set a labour and/or parts discount (total at least 1)"
								);
							if ("amount" === aA && sJ > sk && sk > 0)
								return void u.o.error(
									"Labour discount cannot exceed labour total"
								);
							if ("amount" === a$ && sA > sL && sL > 0)
								return void u.o.error("Parts discount cannot exceed parts total");
							if ("percentage" === aA && sJ > 100)
								return void u.o.error(
									"Labour discount percentage cannot exceed 100"
								);
							if ("percentage" === a$ && sA > 100)
								return void u.o.error(
									"Parts discount percentage cannot exceed 100"
								);
						}
						let t = (0, Y.Z_)(aA, aF),
							r = (0, Y.Z_)(a$, aP),
							i = {
								job_card_type: e2,
								priority: e6,
								estimated_duration_hours: e5 || void 0,
								promised_delivery_date_time: e7 || void 0,
								customer: ek || void 0,
								vehicle_vin: eV || void 0,
								license_plate: am || void 0,
								current_odometer: Number.isFinite(ah) ? ah : void 0,
								warranty_status: av || void 0,
								service_advisor: aj || void 0,
								lead_technician: af || void 0,
								assigned_bay: aN || void 0,
								workshop: aw || void 0,
								warehouse: ew || void 0,
								company: ef || void 0,
								currency: eN || "ETB",
								posting_date: aV || void 0,
								warranty_application_type: ak && "none" !== ak ? ak : void 0,
								...("Discount" === ak
									? { labour_discount: t, parts_discount: r }
									: {}),
								customer_complaint_summary: aM || void 0,
								service_advisor_notes: aW || void 0,
								internal_notes: aB || void 0,
								terms: aO || void 0,
								terms_and_conditions: aQ || void 0,
								appointment: aG || void 0,
								skip_vehicle_inspection: +!!a0,
								inspection: a0 ? void 0 : aY || void 0,
								as_draft: +!!s,
								job_items: sS.map((e) => ({
									name: "",
									complaint_description: e.complaint_description,
									symptom_category: e.symptom_category || void 0,
									severity: e.severity || void 0,
									labor_operation: e.labor_operation || void 0,
								})),
								labour: sC.map((e) => ({
									vehicle_service_item: e.vehicle_service_item,
									service_name: e.vehicle_service_item_name || void 0,
									custom_display_name:
										e.display_name.trim() ||
										e.vehicle_service_item_name ||
										void 0,
									technician: e.technician || void 0,
									estimated_hours: e.estimated_hours,
									rate_per_hour: e.rate_per_hour,
									complaint: e.complaint || void 0,
								})),
								parts: sw.map((e) => ({
									item_code: e.item_code,
									bin_location: e.bin_location,
									quantity_requested: e.quantity_requested,
									unit_price: e.unit_price,
									warehouse: e.warehouse || ew || void 0,
								})),
							};
						try {
							p && V(!0);
							let a = p ? await D.VM(p, i) : await S(i);
							s
								? (y(a.name),
								  w(a.name),
								  u.o.success("Job card saved as draft", { description: a.name }),
								  (h && h === a.name) || e("job-card-new", { id: a.name }))
								: ("Internal" === e2
										? u.o.success(
												"Repair In Progress" === a.status
													? "Internal job card created — repair in progress"
													: "Internal job card created"
										  )
										: u.o.success("Job card created successfully"),
								  e("job-card-detail", { id: a.name }));
						} catch (e) {
							u.o.error(s ? "Failed to save draft" : "Failed to create job card", {
								description: e instanceof Error ? e.message : "Please try again.",
							});
						} finally {
							V(!1);
						}
					},
					sP = async (e) => {
						e.preventDefault(), await sZ("create");
					},
					sq = async () => {
						await sZ("draft");
					};
				return (0, t.jsxs)("div", {
					className:
						"dms-form-page dms-form-compact-mobile min-w-0 space-y-3 sm:space-y-6",
					children: [
						(0, t.jsxs)("div", {
							className: "flex items-center gap-3 sm:gap-4",
							children: [
								(0, t.jsx)(v.$, {
									variant: "ghost",
									size: "icon",
									onClick: () => e("job-cards"),
									children: (0, t.jsx)(B.A, { className: "h-5 w-5" }),
								}),
								(0, t.jsxs)("div", {
									className: "min-w-0",
									children: [
										(0, t.jsx)("h1", {
											className:
												"text-xl font-bold text-foreground sm:text-2xl",
											children: p ? "Continue Job Card" : "New Job Card",
										}),
										(0, t.jsx)("p", {
											className:
												"text-muted-foreground mt-0.5 text-sm sm:mt-1",
											children: p
												? `${p} — keep editing, then create when ready`
												: "Create a new workshop job card",
										}),
									],
								}),
							],
						}),
						h && ec
							? (0, t.jsx)("div", {
									className: "flex h-64 items-center justify-center",
									children: (0, t.jsx)(m.A, {
										className: "h-8 w-8 animate-spin text-primary",
									}),
							  })
							: (0, t.jsxs)(t.Fragment, {
									children: [
										(0, t.jsxs)("form", {
											id: "new-job-card-form",
											onSubmit: sP,
											className: "min-w-0 space-y-3 sm:space-y-6",
											children: [
												(0, t.jsxs)(W.Zp, {
													children: [
														(0, t.jsx)(W.aR, {
															children: (0, t.jsxs)(W.ZB, {
																className:
																	"flex items-center gap-2",
																children: [
																	(0, t.jsx)(U.A, {
																		className: "h-5 w-5",
																	}),
																	"Service Details",
																],
															}),
														}),
														(0, t.jsx)(W.Wu, {
															className: "space-y-4",
															children: (0, t.jsxs)("div", {
																className:
																	"grid md:grid-cols-2 gap-4",
																children: [
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				htmlFor:
																					"job_card_type",
																				children:
																					"Job Card Type *",
																			}),
																			(0, t.jsxs)(f.l6, {
																				value: e2,
																				onValueChange: (
																					e
																				) => {
																					e4(e),
																						"Internal" ===
																							e &&
																							a1(!1);
																				},
																				children: [
																					(0, t.jsx)(
																						f.bq,
																						{
																							id: "job_card_type",
																							children:
																								(0,
																								t.jsx)(
																									f.yv,
																									{
																										placeholder:
																											"Select type",
																									}
																								),
																						}
																					),
																					(0, t.jsx)(
																						f.gC,
																						{
																							children:
																								es.map(
																									(
																										e
																									) =>
																										(0,
																										t.jsx)(
																											f.eb,
																											{
																												value: e,
																												children:
																													e,
																											},
																											e
																										)
																								),
																						}
																					),
																				],
																			}),
																			"Internal" === e2 &&
																				(0, t.jsx)("p", {
																					className:
																						"text-xs text-muted-foreground",
																					children:
																						"Company / fleet vehicle — no estimate or approval. Assign service advisor and lead technician; repair starts automatically when you save.",
																				}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				htmlFor:
																					"priority",
																				children:
																					"Priority",
																			}),
																			(0, t.jsxs)(f.l6, {
																				value: e6,
																				onValueChange: e3,
																				children: [
																					(0, t.jsx)(
																						f.bq,
																						{
																							id: "priority",
																							children:
																								(0,
																								t.jsx)(
																									f.yv,
																									{
																										placeholder:
																											"Select priority",
																									}
																								),
																						}
																					),
																					(0, t.jsx)(
																						f.gC,
																						{
																							children:
																								et.map(
																									(
																										e
																									) =>
																										(0,
																										t.jsx)(
																											f.eb,
																											{
																												value: e,
																												children:
																													e,
																											},
																											e
																										)
																								),
																						}
																					),
																				],
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				htmlFor:
																					"estimated_duration_hours",
																				children:
																					"Estimated Duration (hours)",
																			}),
																			(0, t.jsx)(E.Q, {
																				id: "estimated_duration_hours",
																				min: 0,
																				placeholder: "0",
																				value: e5,
																				onValueChange: e9,
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				htmlFor:
																					"promised_delivery",
																				children:
																					"Promised Delivery Date/Time (optional)",
																			}),
																			(0, t.jsx)(_.p, {
																				id: "promised_delivery",
																				type: "datetime-local",
																				value: e7,
																				onChange: (e) =>
																					e8(
																						e.target
																							.value
																					),
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				htmlFor:
																					"warranty_application_type",
																				children:
																					"Warranty Application Type",
																			}),
																			(0, t.jsxs)(f.l6, {
																				value: ak,
																				onValueChange: (
																					e
																				) => {
																					aL(e),
																						"Discount" !==
																							e &&
																							(aI(
																								"none"
																							),
																							aD(""),
																							aZ(
																								"none"
																							),
																							aq(
																								""
																							)),
																						e &&
																							"none" !==
																								e &&
																							requestAnimationFrame(
																								() => {
																									aT.current?.scrollIntoView(
																										{
																											behavior:
																												"smooth",
																											block: "start",
																										}
																									);
																								}
																							);
																				},
																				children: [
																					(0, t.jsx)(
																						f.bq,
																						{
																							id: "warranty_application_type",
																							children:
																								(0,
																								t.jsx)(
																									f.yv,
																									{
																										placeholder:
																											"None",
																									}
																								),
																						}
																					),
																					(0, t.jsxs)(
																						f.gC,
																						{
																							children:
																								[
																									(0,
																									t.jsx)(
																										f.eb,
																										{
																											value: "none",
																											children:
																												"None",
																										}
																									),
																									(0,
																									t.jsx)(
																										f.eb,
																										{
																											value: "All Invoice",
																											children:
																												"All Invoice",
																										}
																									),
																									(0,
																									t.jsx)(
																										f.eb,
																										{
																											value: "Labour",
																											children:
																												"Labour",
																										}
																									),
																									(0,
																									t.jsx)(
																										f.eb,
																										{
																											value: "Spare Part",
																											children:
																												"Spare Part",
																										}
																									),
																									(0,
																									t.jsx)(
																										f.eb,
																										{
																											value: "Discount",
																											children:
																												"Discount",
																										}
																									),
																								],
																						}
																					),
																				],
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				htmlFor:
																					"posting_date",
																				children:
																					"Posting Date",
																			}),
																			(0, t.jsx)(_.p, {
																				id: "posting_date",
																				type: "date",
																				value: aV,
																				onChange: (e) =>
																					aJ(
																						e.target
																							.value
																					),
																				required: !0,
																			}),
																		],
																	}),
																],
															}),
														}),
													],
												}),
												(0, t.jsxs)(W.Zp, {
													ref: aT,
													children: [
														(0, t.jsx)(W.aR, {
															children: (0, t.jsxs)(W.ZB, {
																className:
																	"flex items-center gap-2",
																children: [
																	(0, t.jsx)(O.A, {
																		className: "h-5 w-5",
																	}),
																	"Customer & Vehicle",
																],
															}),
														}),
														(0, t.jsxs)(W.Wu, {
															className: "space-y-4",
															children: [
																(0, t.jsxs)("div", {
																	className:
																		"grid md:grid-cols-2 gap-4",
																	children: [
																		(0, t.jsxs)("div", {
																			className:
																				"space-y-2 md:col-span-2",
																			children: [
																				(0, t.jsx)(x.J, {
																					children:
																						"Vehicle (VIN) *",
																				}),
																				(0, t.jsx)(b.Zi, {
																					options: sh,
																					value: eV,
																					valueLabel:
																						eA?.vin_number,
																					onValueChange:
																						sm,
																					onSearchChange:
																						eu,
																					onCreateNew:
																						() =>
																							eD(!0),
																					createNewLabel:
																						"New vehicle",
																					placeholder:
																						"Type at least 3 characters of VIN, chassis, or plate...",
																					isLoading: a9,
																				}),
																				(0, t.jsx)("p", {
																					className:
																						"text-xs text-muted-foreground",
																					children:
																						"Search and select the vehicle first. Use the “+” inside the field to register a vehicle without leaving this page. The registered owner fills in as customer when available; you can change or create a customer without clearing the VIN.",
																				}),
																			],
																		}),
																		(0, t.jsxs)("div", {
																			className: "space-y-2",
																			children: [
																				(0, t.jsx)(x.J, {
																					children:
																						"Customer *",
																				}),
																				(0, t.jsx)(o.Z, {
																					doctype:
																						"Customer",
																					onCreated: (
																						e,
																						a
																					) => {
																						eL(e),
																							ad({
																								name: e,
																								customer_name:
																									a ||
																									e,
																							});
																					},
																					children: (0,
																					t.jsx)(b.Zi, {
																						options:
																							su,
																						value: ek,
																						valueLabel:
																							ao?.customer_name,
																						onValueChange:
																							(
																								e
																							) => {
																								let a =
																									(0,
																									c.R)(
																										e,
																										eZ,
																										e0
																									);
																								eL(
																									a.customer
																								),
																									ad(
																										a.meta
																									);
																							},
																						onSearchChange:
																							ed,
																						placeholder:
																							"Search customers...",
																						isLoading:
																							eP,
																					}),
																				}),
																			],
																		}),
																		ek
																			? (0, t.jsx)(d.P, {
																					className:
																						"md:col-span-2",
																					customer: ek,
																					customerName:
																						ao?.customer_name,
																					fallback: {
																						mobile_no:
																							ao?.mobile_no,
																					},
																			  })
																			: null,
																		(0, t.jsxs)("div", {
																			className: "space-y-2",
																			children: [
																				(0, t.jsx)(x.J, {
																					htmlFor:
																						"license_plate",
																					children:
																						"License plate",
																				}),
																				(0, t.jsx)(_.p, {
																					id: "license_plate",
																					value: am,
																					onChange: (
																						e
																					) =>
																						au(
																							e.target.value.toUpperCase()
																						),
																					placeholder:
																						"Editable — confirm or update for this visit",
																				}),
																			],
																		}),
																		(0, t.jsxs)("div", {
																			className: "space-y-2",
																			children: [
																				(0, t.jsx)(x.J, {
																					htmlFor:
																						"current_odometer",
																					children:
																						"Current Odometer (km)",
																				}),
																				(0, t.jsx)(_.p, {
																					id: "current_odometer",
																					type: "number",
																					min: 0,
																					placeholder:
																						"0",
																					value:
																						ah || "",
																					onChange: (
																						e
																					) =>
																						ap(
																							parseInt(
																								e
																									.target
																									.value
																							) || 0
																						),
																				}),
																			],
																		}),
																	],
																}),
																ax &&
																	(0, t.jsx)(K.x, {
																		summary: ax,
																	}),
																(0, t.jsx)(R.w, {}),
																(0, t.jsx)("div", {
																	className:
																		"grid md:grid-cols-2 gap-4",
																	children: (0, t.jsx)("div", {
																		className:
																			"space-y-2 sm:col-span-2 md:col-span-2",
																		children: (0, t.jsxs)(
																			"div",
																			{
																				className:
																					"flex flex-wrap items-center gap-x-4 gap-y-2",
																				children: [
																					"Internal" !==
																						e2 &&
																						(0,
																						t.jsxs)(
																							"div",
																							{
																								className:
																									"flex items-center gap-2 shrink-0",
																								children:
																									[
																										(0,
																										t.jsx)(
																											g.S,
																											{
																												id: "skip-vehicle-inspection",
																												checked:
																													a0,
																												onCheckedChange:
																													(
																														e
																													) => {
																														let a =
																															!0 ===
																															e;
																														a1(
																															a
																														),
																															a &&
																																(aK(
																																	""
																																),
																																(a6.current =
																																	null));
																													},
																											}
																										),
																										(0,
																										t.jsx)(
																											x.J,
																											{
																												htmlFor:
																													"skip-vehicle-inspection",
																												className:
																													"font-normal cursor-pointer whitespace-nowrap",
																												children:
																													"Skip vehicle inspection",
																											}
																										),
																									],
																							}
																						),
																					(0, t.jsxs)(
																						"div",
																						{
																							className:
																								"min-w-0 flex-1 space-y-2",
																							children:
																								[
																									(0,
																									t.jsxs)(
																										x.J,
																										{
																											children:
																												[
																													"Vehicle Inspection",
																													"Internal" ===
																														e2 ||
																													a0
																														? " (optional)"
																														: " *",
																												],
																										}
																									),
																									(0,
																									t.jsx)(
																										b.Zi,
																										{
																											options:
																												sb,
																											value: aY,
																											onValueChange:
																												aK,
																											placeholder:
																												a2
																													? "Loading complaints…"
																													: a0
																													? "Skipped — optional"
																													: "Internal" ===
																													  e2
																													? "Optional — link an inspection if available"
																													: "Search inspections...",
																											isLoading:
																												a2,
																											disabled:
																												a0,
																										}
																									),
																								],
																						}
																					),
																				],
																			}
																		),
																	}),
																}),
															],
														}),
													],
												}),
												(0, t.jsxs)(W.Zp, {
													children: [
														(0, t.jsx)(W.aR, {
															children: (0, t.jsxs)(W.ZB, {
																className:
																	"flex items-center gap-2",
																children: [
																	(0, t.jsx)(H.A, {
																		className: "h-5 w-5",
																	}),
																	"Assignment",
																],
															}),
														}),
														(0, t.jsx)(W.Wu, {
															className: "space-y-4",
															children: (0, t.jsxs)("div", {
																className:
																	"grid md:grid-cols-2 gap-4",
																children: [
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				children:
																					"Service Advisor",
																			}),
																			(0, t.jsx)(o.Z, {
																				doctype:
																					"Service Advisor",
																				onCreated: ay,
																				children: (0,
																				t.jsx)(b.Zi, {
																					options:
																						eq?.map(
																							(
																								e
																							) => ({
																								value: e.name,
																								label: e.full_name,
																							})
																						) || [],
																					value: aj,
																					onValueChange:
																						ay,
																					placeholder:
																						"Search advisors...",
																					isLoading: eT,
																				}),
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				children:
																					"Lead Technician",
																			}),
																			(0, t.jsx)(o.Z, {
																				doctype:
																					"Technician",
																				onCreated: ab,
																				children: (0,
																				t.jsx)(b.Zi, {
																					options:
																						eW?.map(
																							(
																								e
																							) => ({
																								value: e.name,
																								label: e.full_name,
																							})
																						) || [],
																					value: af,
																					valueLabel: (0,
																					q.g)(af, eW),
																					onValueChange:
																						ab,
																					placeholder:
																						"Search technicians...",
																					isLoading: eR,
																				}),
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				children:
																					"Assigned Bay (optional)",
																			}),
																			(0, t.jsx)(b.Zi, {
																				options:
																					eB?.map(
																						(e) => ({
																							value: e.name,
																							label:
																								e.bay_name ||
																								e.bay_number ||
																								e.name,
																							description:
																								e.branch ||
																								void 0,
																						})
																					) || [],
																				value: aN,
																				onValueChange: sp,
																				placeholder:
																					"Search bays...",
																				isLoading: eU,
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				children:
																					"Workshop",
																			}),
																			(0, t.jsx)(_.p, {
																				value: aw,
																				readOnly: !0,
																				placeholder:
																					"Auto-filled from service bay",
																				className:
																					"bg-muted",
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				htmlFor: "company",
																				children:
																					"Company *",
																			}),
																			(0, t.jsx)(b.Zi, {
																				value: ef,
																				onValueChange: (
																					e
																				) => {
																					eb(e),
																						eS(""),
																						eg("");
																					let a =
																						eY?.find(
																							(a) =>
																								a.name ===
																								e
																						);
																					a?.default_currency &&
																						eC(
																							a.default_currency
																						);
																				},
																				onSearchChange: ey,
																				placeholder:
																					"Select company...",
																				isLoading: eK,
																				options: (
																					eY || []
																				).map((e) => ({
																					value: e.name,
																					label:
																						e.company_name ||
																						e.name,
																				})),
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				htmlFor:
																					"currency",
																				children:
																					"Currency",
																			}),
																			(0, t.jsxs)(f.l6, {
																				value: eN,
																				onValueChange: eC,
																				children: [
																					(0, t.jsx)(
																						f.bq,
																						{
																							id: "currency",
																							children:
																								(0,
																								t.jsx)(
																									f.yv,
																									{
																										placeholder:
																											"Currency",
																									}
																								),
																						}
																					),
																					(0, t.jsx)(
																						f.gC,
																						{
																							children:
																								(e1?.length
																									? e1
																									: [
																											"ETB",
																									  ]
																								).map(
																									(
																										e
																									) =>
																										(0,
																										t.jsx)(
																											f.eb,
																											{
																												value: e,
																												children:
																													e,
																											},
																											e
																										)
																								),
																						}
																					),
																				],
																			}),
																			(0, t.jsx)("p", {
																				className:
																					"text-xs text-muted-foreground",
																				children:
																					"Used for job costing and when creating a sales invoice from this job card.",
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className: "space-y-2",
																		children: [
																			(0, t.jsx)(x.J, {
																				children:
																					"Warehouse",
																			}),
																			(0, t.jsx)(b.Zi, {
																				options:
																					eG?.map(
																						(e) => ({
																							value: e.name,
																							label:
																								e.warehouse_name ||
																								e.name,
																						})
																					) || [],
																				value: ew,
																				onValueChange: eS,
																				onSearchChange: eg,
																				placeholder: ef
																					? "Search warehouses..."
																					: "Select company first",
																				isLoading: eX,
																				disabled: !ef,
																			}),
																		],
																	}),
																],
															}),
														}),
													],
												}),
												(0, t.jsxs)(W.Zp, {
													children: [
														(0, t.jsxs)(W.aR, {
															children: [
																(0, t.jsx)(W.ZB, {
																	children:
																		"Customer Complaints",
																}),
																(0, t.jsx)(W.BT, {
																	children:
																		"Filled from the selected inspection; you can edit before saving",
																}),
															],
														}),
														(0, t.jsx)(W.Wu, {
															children: (0, t.jsx)(j.T, {
																placeholder:
																	"Enter customer complaint summary...",
																rows: 4,
																value: aM,
																onChange: (e) =>
																	aE(e.target.value),
															}),
														}),
													],
												}),
												(0, t.jsxs)(W.Zp, {
													children: [
														(0, t.jsxs)(W.aR, {
															children: [
																(0, t.jsx)(W.ZB, {
																	children: "Job Items",
																}),
																(0, t.jsx)(W.BT, {
																	children:
																		"Customer complaints from the inspection (same fields as Job Card Items)",
																}),
															],
														}),
														(0, t.jsxs)(W.Wu, {
															className: "space-y-4",
															children: [
																se.map((e, a) =>
																	(0, t.jsxs)(
																		"div",
																		{
																			className:
																				"grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-end sm:gap-2",
																			children: [
																				(0, t.jsxs)(
																					"div",
																					{
																						className:
																							"space-y-1 sm:col-span-5",
																						children: [
																							(0,
																							t.jsx)(
																								x.J,
																								{
																									className:
																										"text-xs",
																									children:
																										"Complaint Description *",
																								}
																							),
																							(0,
																							t.jsx)(
																								_.p,
																								{
																									placeholder:
																										"Customer complaint / work description",
																									value: e.complaint_description,
																									onChange:
																										(
																											e
																										) =>
																											sx(
																												a,
																												{
																													complaint_description:
																														e
																															.target
																															.value,
																												}
																											),
																								}
																							),
																						],
																					}
																				),
																				(0, t.jsxs)(
																					"div",
																					{
																						className:
																							"space-y-1 sm:col-span-3",
																						children: [
																							(0,
																							t.jsx)(
																								x.J,
																								{
																									className:
																										"text-xs",
																									children:
																										"Symptom Category",
																								}
																							),
																							(0,
																							t.jsxs)(
																								f.l6,
																								{
																									value:
																										e.symptom_category ||
																										T.d9,
																									onValueChange:
																										(
																											e
																										) =>
																											sx(
																												a,
																												{
																													symptom_category:
																														e,
																												}
																											),
																									children:
																										[
																											(0,
																											t.jsx)(
																												f.bq,
																												{
																													className:
																														"h-9",
																													children:
																														(0,
																														t.jsx)(
																															f.yv,
																															{
																																placeholder:
																																	"Select category",
																															}
																														),
																												}
																											),
																											(0,
																											t.jsx)(
																												f.gC,
																												{
																													children:
																														T.X5.map(
																															(
																																e
																															) =>
																																(0,
																																t.jsx)(
																																	f.eb,
																																	{
																																		value: e,
																																		children:
																																			e,
																																	},
																																	e
																																)
																														),
																												}
																											),
																										],
																								}
																							),
																						],
																					}
																				),
																				(0, t.jsxs)(
																					"div",
																					{
																						className:
																							"space-y-1 sm:col-span-3",
																						children: [
																							(0,
																							t.jsx)(
																								x.J,
																								{
																									className:
																										"text-xs",
																									children:
																										"Severity",
																								}
																							),
																							(0,
																							t.jsxs)(
																								f.l6,
																								{
																									value:
																										e.severity ||
																										T.c6,
																									onValueChange:
																										(
																											e
																										) =>
																											sx(
																												a,
																												{
																													severity:
																														e,
																												}
																											),
																									children:
																										[
																											(0,
																											t.jsx)(
																												f.bq,
																												{
																													className:
																														"h-9",
																													children:
																														(0,
																														t.jsx)(
																															f.yv,
																															{
																																placeholder:
																																	"Select severity",
																															}
																														),
																												}
																											),
																											(0,
																											t.jsx)(
																												f.gC,
																												{
																													children:
																														T.hq.map(
																															(
																																e
																															) =>
																																(0,
																																t.jsx)(
																																	f.eb,
																																	{
																																		value: e,
																																		children:
																																			e,
																																	},
																																	e
																																)
																														),
																												}
																											),
																										],
																								}
																							),
																						],
																					}
																				),
																				(0, t.jsx)("div", {
																					className:
																						"flex justify-end sm:col-span-1",
																					children: (0,
																					t.jsx)(v.$, {
																						type: "button",
																						variant:
																							"ghost",
																						size: "icon",
																						onClick:
																							() => {
																								sa(
																									(
																										e
																									) => {
																										let s =
																											e.filter(
																												(
																													e,
																													s
																												) =>
																													s !==
																													a
																											);
																										return s.length
																											? s
																											: [
																													er(),
																											  ];
																									}
																								);
																							},
																						className:
																							"h-8 w-8 text-destructive",
																						children:
																							(0,
																							t.jsx)(
																								Q.A,
																								{
																									className:
																										"h-4 w-4",
																								}
																							),
																					}),
																				}),
																			],
																		},
																		a
																	)
																),
																(0, t.jsx)(M._, {
																	onClick: () => {
																		sa((e) => [...e, er()]);
																	},
																}),
															],
														}),
													],
												}),
												(0, t.jsxs)(W.Zp, {
													children: [
														(0, t.jsxs)(W.aR, {
															children: [
																(0, t.jsxs)(W.ZB, {
																	className:
																		"flex items-center gap-2",
																	children: [
																		(0, t.jsx)(z.A, {
																			className: "h-5 w-5",
																		}),
																		"Service Package",
																	],
																}),
																(0, t.jsx)(W.BT, {
																	children: eV
																		? a7?.vehicle_model_label
																			? `Packages for ${a7.vehicle_model_label} only. Choosing a package fills labour and parts below.`
																			: a7?.message ||
																			  "Select a VIN with a linked vehicle model to see packages."
																		: "Select a vehicle (VIN) first — the model is taken from the vehicle record.",
																}),
															],
														}),
														(0, t.jsxs)(W.Wu, {
															className: "space-y-4",
															children: [
																(0, t.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, t.jsx)(x.J, {
																			children: "Package",
																		}),
																		(0, t.jsx)(b.Zi, {
																			options: sN,
																			value: ae,
																			onValueChange: aa,
																			placeholder: eV
																				? a8 || as
																					? "Loading…"
																					: sN.length
																					? "Select service package…"
																					: "No packages for this model"
																				: "Select VIN first",
																			disabled:
																				!eV ||
																				0 === sN.length ||
																				as,
																			isLoading: a8 || as,
																		}),
																	],
																}),
																eV &&
																	!a8 &&
																	0 === sN.length &&
																	(0, t.jsx)("p", {
																		className:
																			"text-sm text-muted-foreground",
																		children:
																			"Set Model on the vehicle (VIN No), then link packages under Vehicle Service Package → Applicable Vehicle Models.",
																	}),
															],
														}),
													],
												}),
												(0, t.jsxs)(W.Zp, {
													children: [
														(0, t.jsxs)(W.aR, {
															children: [
																(0, t.jsxs)(W.ZB, {
																	className:
																		"flex items-center gap-2",
																	children: [
																		(0, t.jsx)(U.A, {
																			className: "h-5 w-5",
																		}),
																		"Labour Lines",
																	],
																}),
																(0, t.jsx)(W.BT, {
																	children:
																		"Filled from the service package above, or add lines manually. Edit Display name on this job card only — the master service item stays unchanged.",
																}),
															],
														}),
														(0, t.jsxs)(W.Wu, {
															className: "space-y-4",
															children: [
																ss.map((e, a) =>
																	(0, t.jsxs)(
																		"div",
																		{
																			className:
																				"grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-end sm:gap-2",
																			children: [
																				(0, t.jsxs)(
																					"div",
																					{
																						className:
																							"space-y-1 sm:col-span-3",
																						children: [
																							(0,
																							t.jsx)(
																								x.J,
																								{
																									className:
																										"text-xs",
																									children:
																										"Service Item *",
																								}
																							),
																							(0,
																							t.jsx)(
																								b.Zi,
																								{
																									options:
																										eO?.map(
																											(
																												e
																											) => ({
																												value: e.name,
																												label: (0,
																												F.sJ)(
																													e
																												),
																												description:
																													e.custom_rate ||
																													e.estimated_hours
																														? [
																																e.custom_rate
																																	? `Rate: ${e.custom_rate}`
																																	: null,
																																e.estimated_hours
																																	? `${e.estimated_hours}h`
																																	: null,
																														  ]
																																.filter(
																																	Boolean
																																)
																																.join(
																																	" \xb7 "
																																)
																														: void 0,
																											})
																										) ||
																										[],
																									value: e.vehicle_service_item,
																									onValueChange:
																										(
																											e
																										) =>
																											sv(
																												a,
																												e
																											),
																									onSearchChange:
																										ep,
																									placeholder:
																										"Search items...",
																									isLoading:
																										eH,
																									onCreateNew:
																										() => {
																											sl(
																												a
																											),
																												ac(
																													!0
																												);
																										},
																									createNewLabel:
																										"New Service Item",
																								}
																							),
																						],
																					}
																				),
																				(0, t.jsxs)(
																					"div",
																					{
																						className:
																							"space-y-1 sm:col-span-3",
																						children: [
																							(0,
																							t.jsx)(
																								x.J,
																								{
																									className:
																										"text-xs",
																									children:
																										"Technician",
																								}
																							),
																							(0,
																							t.jsx)(
																								o.Z,
																								{
																									doctype:
																										"Technician",
																									onCreated:
																										(
																											e,
																											s
																										) => {
																											sg(
																												a,
																												{
																													technician:
																														e,
																													technician_name:
																														s ||
																														e,
																												}
																											);
																										},
																									children:
																										(0,
																										t.jsx)(
																											b.Zi,
																											{
																												options:
																													eW?.map(
																														(
																															e
																														) => ({
																															value: e.name,
																															label: e.full_name,
																														})
																													) ||
																													[],
																												value: e.technician,
																												valueLabel:
																													e.technician_name ||
																													(0,
																													q.g)(
																														e.technician,
																														eW
																													),
																												onValueChange:
																													(
																														e
																													) => {
																														let s =
																															eW?.find(
																																(
																																	a
																																) =>
																																	a.name ===
																																	e
																															);
																														sg(
																															a,
																															{
																																technician:
																																	e,
																																technician_name:
																																	s?.full_name ||
																																	e,
																															}
																														);
																													},
																												placeholder:
																													"Search technicians...",
																												isLoading:
																													eR,
																											}
																										),
																								}
																							),
																						],
																					}
																				),
																				(0, t.jsxs)(
																					"div",
																					{
																						className:
																							"grid grid-cols-2 gap-3 sm:contents",
																						children: [
																							(0,
																							t.jsxs)(
																								"div",
																								{
																									className:
																										"space-y-1 sm:col-span-2",
																									children:
																										[
																											(0,
																											t.jsx)(
																												x.J,
																												{
																													className:
																														"text-xs",
																													children:
																														"Hours",
																												}
																											),
																											(0,
																											t.jsx)(
																												E.Q,
																												{
																													min: 0,
																													placeholder:
																														"0",
																													value: e.estimated_hours,
																													onValueChange:
																														(
																															e
																														) =>
																															sg(
																																a,
																																{
																																	estimated_hours:
																																		e,
																																}
																															),
																												}
																											),
																										],
																								}
																							),
																							(0,
																							t.jsxs)(
																								"div",
																								{
																									className:
																										"space-y-1 sm:col-span-2",
																									children:
																										[
																											(0,
																											t.jsx)(
																												x.J,
																												{
																													className:
																														"text-xs",
																													children:
																														s
																															? "Rate/Hr"
																															: "Rate/Hr (fixed)",
																												}
																											),
																											(0,
																											t.jsx)(
																												E.Q,
																												{
																													min: 0,
																													placeholder:
																														"0",
																													value: e.rate_per_hour,
																													onValueChange:
																														s
																															? (
																																	e
																															  ) =>
																																	sg(
																																		a,
																																		{
																																			rate_per_hour:
																																				e,
																																		}
																																	)
																															: () => {},
																													disabled:
																														!s,
																												}
																											),
																										],
																								}
																							),
																						],
																					}
																				),
																				(0, t.jsx)("div", {
																					className:
																						"flex justify-end sm:col-span-2",
																					children: (0,
																					t.jsx)(v.$, {
																						type: "button",
																						variant:
																							"ghost",
																						size: "icon",
																						onClick:
																							() => {
																								st(
																									(
																										e
																									) => {
																										let s =
																											e.filter(
																												(
																													e,
																													s
																												) =>
																													s !==
																													a
																											);
																										return s.length
																											? s
																											: [
																													ei(),
																											  ];
																									}
																								);
																							},
																						className:
																							"h-8 w-8 text-destructive",
																						children:
																							(0,
																							t.jsx)(
																								Q.A,
																								{
																									className:
																										"h-4 w-4",
																								}
																							),
																					}),
																				}),
																				(0, t.jsxs)(
																					"div",
																					{
																						className:
																							"space-y-1 sm:col-span-12",
																						children: [
																							(0,
																							t.jsx)(
																								x.J,
																								{
																									className:
																										"text-xs",
																									children:
																										"Display name",
																								}
																							),
																							(0,
																							t.jsx)(
																								_.p,
																								{
																									value: e.display_name,
																									placeholder:
																										"Name on this job card only",
																									disabled:
																										!e.vehicle_service_item,
																									onChange:
																										(
																											e
																										) =>
																											sg(
																												a,
																												{
																													display_name:
																														e
																															.target
																															.value,
																												}
																											),
																								}
																							),
																						],
																					}
																				),
																			],
																		},
																		a
																	)
																),
																(0, t.jsx)(M._, {
																	onClick: () => {
																		st((e) => [...e, ei()]);
																	},
																}),
															],
														}),
													],
												}),
												(0, t.jsxs)(W.Zp, {
													children: [
														(0, t.jsxs)(W.aR, {
															children: [
																(0, t.jsx)(W.ZB, {
																	children: "Parts Required",
																}),
																(0, t.jsx)(W.BT, {
																	children:
																		"Add spare parts needed for this job",
																}),
															],
														}),
														(0, t.jsxs)(W.Wu, {
															className: "space-y-4",
															children: [
																sr.map((e, a) =>
																	(0, t.jsxs)(
																		"div",
																		{
																			className:
																				"grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-end sm:gap-2",
																			children: [
																				(0, t.jsxs)(
																					"div",
																					{
																						className:
																							"space-y-1 sm:col-span-5",
																						children: [
																							(0,
																							t.jsx)(
																								x.J,
																								{
																									className:
																										"text-xs",
																									children:
																										"Spare Part *",
																								}
																							),
																							(0,
																							t.jsx)(
																								b.Zi,
																								{
																									options:
																										eQ?.map(
																											F.lE
																										) ||
																										[],
																									value: e.item_code,
																									onValueChange:
																										(
																											e
																										) =>
																											s_(
																												a,
																												e
																											),
																									onSearchChange:
																										e_,
																									placeholder:
																										"Search parts...",
																									isLoading:
																										ez,
																									onCreateNew:
																										() => {
																											so(
																												a
																											),
																												an(
																													!0
																												);
																										},
																									createNewLabel:
																										"New Spare Part",
																								}
																							),
																						],
																					}
																				),
																				(0, t.jsxs)(
																					"div",
																					{
																						className:
																							"grid grid-cols-2 gap-3 sm:contents",
																						children: [
																							(0,
																							t.jsxs)(
																								"div",
																								{
																									className:
																										"space-y-1 sm:col-span-2",
																									children:
																										[
																											(0,
																											t.jsx)(
																												x.J,
																												{
																													className:
																														"text-xs",
																													children:
																														"Quantity",
																												}
																											),
																											(0,
																											t.jsx)(
																												E.Q,
																												{
																													min: 0,
																													placeholder:
																														"1",
																													value: e.quantity_requested,
																													onValueChange:
																														(
																															e
																														) =>
																															sj(
																																a,
																																{
																																	quantity_requested:
																																		e,
																																}
																															),
																												}
																											),
																										],
																								}
																							),
																							(0,
																							t.jsxs)(
																								"div",
																								{
																									className:
																										"space-y-1 sm:col-span-3",
																									children:
																										[
																											(0,
																											t.jsx)(
																												x.J,
																												{
																													className:
																														"text-xs",
																													children:
																														s
																															? "Unit Price (editable)"
																															: "Unit Price (fixed)",
																												}
																											),
																											(0,
																											t.jsx)(
																												E.Q,
																												{
																													min: 0,
																													placeholder:
																														"0",
																													value: e.unit_price,
																													onValueChange:
																														s
																															? (
																																	e
																															  ) =>
																																	sj(
																																		a,
																																		{
																																			unit_price:
																																				e,
																																		}
																																	)
																															: () => {},
																													disabled:
																														!s,
																												}
																											),
																										],
																								}
																							),
																						],
																					}
																				),
																				(0, t.jsx)("div", {
																					className:
																						"flex justify-end sm:col-span-2",
																					children: (0,
																					t.jsx)(v.$, {
																						type: "button",
																						variant:
																							"ghost",
																						size: "icon",
																						onClick:
																							() => {
																								si(
																									(
																										e
																									) => {
																										let s =
																											e.filter(
																												(
																													e,
																													s
																												) =>
																													s !==
																													a
																											);
																										return s.length
																											? s
																											: [
																													en(
																														ew
																													),
																											  ];
																									}
																								);
																							},
																						className:
																							"h-8 w-8 text-destructive",
																						children:
																							(0,
																							t.jsx)(
																								Q.A,
																								{
																									className:
																										"h-4 w-4",
																								}
																							),
																					}),
																				}),
																			],
																		},
																		a
																	)
																),
																(0, t.jsx)(M._, {
																	onClick: () => {
																		si((e) => [...e, en(ew)]);
																	},
																}),
															],
														}),
													],
												}),
												(0, t.jsx)(W.Zp, {
													children: (0, t.jsxs)(W.Wu, {
														className: "p-4 space-y-4",
														children: [
															"Discount" === ak &&
																(0, t.jsxs)("div", {
																	className:
																		"grid gap-4 md:grid-cols-2",
																	children: [
																		(0, t.jsx)(X.w, {
																			label: "Labour",
																			mode: aA,
																			onModeChange: aI,
																			value: aF,
																			onValueChange: aD,
																			subtotal: sk,
																		}),
																		(0, t.jsx)(X.w, {
																			label: "Parts",
																			mode: a$,
																			onModeChange: aZ,
																			value: aP,
																			onValueChange: aq,
																			subtotal: sL,
																		}),
																	],
																}),
															(0, t.jsxs)("div", {
																className:
																	"flex flex-col items-end gap-2",
																children: [
																	(0, t.jsxs)("div", {
																		className:
																			"flex items-center gap-8",
																		children: [
																			(0, t.jsx)("span", {
																				className:
																					"text-muted-foreground",
																				children:
																					"Labour Total:",
																			}),
																			(0, t.jsx)("span", {
																				className:
																					"font-medium w-32 text-right",
																				children:
																					sk.toLocaleString(
																						void 0,
																						{
																							minimumFractionDigits: 2,
																							maximumFractionDigits: 2,
																						}
																					),
																			}),
																		],
																	}),
																	(0, t.jsxs)("div", {
																		className:
																			"flex items-center gap-8",
																		children: [
																			(0, t.jsx)("span", {
																				className:
																					"text-muted-foreground",
																				children:
																					"Parts Total:",
																			}),
																			(0, t.jsx)("span", {
																				className:
																					"font-medium w-32 text-right",
																				children:
																					sL.toLocaleString(
																						void 0,
																						{
																							minimumFractionDigits: 2,
																							maximumFractionDigits: 2,
																						}
																					),
																			}),
																		],
																	}),
																	(0, t.jsx)(R.w, {
																		className: "w-64",
																	}),
																	(0, t.jsxs)("div", {
																		className:
																			"flex items-center gap-8",
																		children: [
																			(0, t.jsx)("span", {
																				className:
																					"text-muted-foreground",
																				children:
																					"Total Amount:",
																			}),
																			(0, t.jsx)("span", {
																				className:
																					"font-medium w-32 text-right",
																				children:
																					sV.toLocaleString(
																						void 0,
																						{
																							minimumFractionDigits: 2,
																							maximumFractionDigits: 2,
																						}
																					),
																			}),
																		],
																	}),
																	ak &&
																		"none" !== ak &&
																		(0, t.jsxs)("div", {
																			className:
																				"flex items-center gap-8",
																			children: [
																				(0, t.jsxs)(
																					"span",
																					{
																						className:
																							"text-muted-foreground text-sm",
																						children: [
																							"Warranty (",
																							ak,
																							"):",
																						],
																					}
																				),
																				(0, t.jsxs)(
																					"span",
																					{
																						className:
																							"font-medium w-32 text-right text-orange-600",
																						children: [
																							"-",
																							(
																								sV -
																								s$
																							).toLocaleString(
																								void 0,
																								{
																									minimumFractionDigits: 2,
																									maximumFractionDigits: 2,
																								}
																							),
																						],
																					}
																				),
																			],
																		}),
																	"Discount" === ak &&
																		sI > 0 &&
																		(0, t.jsxs)("div", {
																			className:
																				"flex items-center gap-8",
																			children: [
																				(0, t.jsx)(
																					"span",
																					{
																						className:
																							"text-muted-foreground text-sm",
																						children:
																							"Labour discount:",
																					}
																				),
																				(0, t.jsxs)(
																					"span",
																					{
																						className:
																							"font-medium w-32 text-right text-orange-600",
																						children: [
																							"-",
																							sI.toLocaleString(
																								void 0,
																								{
																									minimumFractionDigits: 2,
																									maximumFractionDigits: 2,
																								}
																							),
																						],
																					}
																				),
																			],
																		}),
																	"Discount" === ak &&
																		sF > 0 &&
																		(0, t.jsxs)("div", {
																			className:
																				"flex items-center gap-8",
																			children: [
																				(0, t.jsx)(
																					"span",
																					{
																						className:
																							"text-muted-foreground text-sm",
																						children:
																							"Parts discount:",
																					}
																				),
																				(0, t.jsxs)(
																					"span",
																					{
																						className:
																							"font-medium w-32 text-right text-orange-600",
																						children: [
																							"-",
																							sF.toLocaleString(
																								void 0,
																								{
																									minimumFractionDigits: 2,
																									maximumFractionDigits: 2,
																								}
																							),
																						],
																					}
																				),
																			],
																		}),
																	(0, t.jsx)(R.w, {
																		className: "w-64",
																	}),
																	(0, t.jsxs)("div", {
																		className:
																			"flex items-center gap-8",
																		children: [
																			(0, t.jsx)("span", {
																				className:
																					"font-semibold",
																				children:
																					"Net Amount:",
																			}),
																			(0, t.jsx)("span", {
																				className:
																					"font-bold text-lg w-32 text-right text-primary",
																				children:
																					s$.toLocaleString(
																						void 0,
																						{
																							minimumFractionDigits: 2,
																							maximumFractionDigits: 2,
																						}
																					),
																			}),
																		],
																	}),
																],
															}),
														],
													}),
												}),
												(0, t.jsxs)(W.Zp, {
													children: [
														(0, t.jsx)(W.aR, {
															children: (0, t.jsx)(W.ZB, {
																children: "Notes",
															}),
														}),
														(0, t.jsxs)(W.Wu, {
															className: "space-y-4",
															children: [
																(0, t.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, t.jsx)(x.J, {
																			children:
																				"Terms & Conditions",
																		}),
																		(0, t.jsx)(b.Zi, {
																			options:
																				eM?.map((e) => ({
																					value: e.name,
																					label: e.is_default
																						? `${e.title} (Default)`
																						: e.title,
																					description:
																						e.terms_and_conditions
																							? e.terms_and_conditions
																									.replace(
																										/<[^>]*>/g,
																										""
																									)
																									.slice(
																										0,
																										80
																									) +
																							  "..."
																							: void 0,
																				})) || [],
																			value: aO,
																			onValueChange: (e) => {
																				aH(e);
																				let a = eM?.find(
																					(a) =>
																						a.name ===
																						e
																				);
																				az(
																					(0, P.i)(
																						a?.terms_and_conditions ||
																							""
																					)
																				);
																			},
																			placeholder:
																				"Select terms...",
																			emptyMessage:
																				"No job card terms found",
																			isLoading: eE,
																			valueLabel:
																				eM?.find(
																					(e) =>
																						e.name ===
																						aO
																				)?.title || aO,
																		}),
																	],
																}),
																(0, t.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, t.jsx)(x.J, {
																			htmlFor:
																				"terms_and_conditions",
																			children:
																				"Terms & Conditions Content",
																		}),
																		(0, t.jsx)(j.T, {
																			id: "terms_and_conditions",
																			rows: 6,
																			placeholder:
																				"Terms & conditions text will be shown here — edit as needed for this job",
																			value: aQ,
																			onChange: (e) =>
																				az(e.target.value),
																			disabled: !aO,
																		}),
																		aO &&
																			(0, t.jsx)("p", {
																				className:
																					"text-xs text-muted-foreground",
																				children:
																					"Default text loaded from the selected terms template. Edit in your own words before saving if needed.",
																			}),
																	],
																}),
																(0, t.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, t.jsx)(x.J, {
																			htmlFor:
																				"service_advisor_notes",
																			children:
																				"Service Advisor Notes",
																		}),
																		(0, t.jsx)(j.T, {
																			id: "service_advisor_notes",
																			placeholder:
																				"Notes from the service advisor...",
																			rows: 3,
																			value: aW,
																			onChange: (e) =>
																				aR(e.target.value),
																		}),
																	],
																}),
																(0, t.jsxs)("div", {
																	className: "space-y-2",
																	children: [
																		(0, t.jsx)(x.J, {
																			htmlFor:
																				"internal_notes",
																			children:
																				"Internal Notes",
																		}),
																		(0, t.jsx)(j.T, {
																			id: "internal_notes",
																			placeholder:
																				"Internal workshop notes...",
																			rows: 3,
																			value: aB,
																			onChange: (e) =>
																				aU(e.target.value),
																		}),
																	],
																}),
															],
														}),
													],
												}),
											],
										}),
										(0, t.jsxs)(I.h, {
											children: [
												(0, t.jsx)(v.$, {
													type: "button",
													variant: "outline",
													className: "min-h-11 w-full sm:w-auto",
													onClick: () => e("job-cards"),
													children: "Cancel",
												}),
												(0, t.jsx)(v.$, {
													type: "button",
													variant: "outline",
													className: "min-h-11 w-full sm:w-auto",
													onClick: sq,
													disabled: J,
													children: J
														? (0, t.jsxs)(t.Fragment, {
																children: [
																	(0, t.jsx)(m.A, {
																		className:
																			"mr-2 h-4 w-4 animate-spin",
																	}),
																	"Saving...",
																],
														  })
														: (0, t.jsxs)(t.Fragment, {
																children: [
																	(0, t.jsx)(G.A, {
																		className: "mr-2 h-4 w-4",
																	}),
																	"Save as Draft",
																],
														  }),
												}),
												(0, t.jsx)(v.$, {
													type: "submit",
													form: "new-job-card-form",
													disabled: J,
													className: "min-h-11 w-full sm:w-auto",
													children: J
														? "Creating..."
														: "Create Job Card",
												}),
											],
										}),
										(0, t.jsx)(ee.d, {
											open: ai,
											onOpenChange: an,
											onCreated: (e, a) => {
												sj(sc, { item_code: e, item_name: a }),
													e_(e),
													u.o.success(
														`Spare part ${a} created and selected.`
													);
											},
										}),
										(0, t.jsx)(ea.B, {
											open: al,
											onOpenChange: ac,
											onCreated: (e) => {
												sv(sn, e),
													ep(e),
													u.o.success(
														"Service item created and selected."
													);
											},
										}),
										(0, t.jsx)(A, {
											open: eF,
											onOpenChange: eD,
											defaultCompany: ef,
											defaultCustomer: ek,
											defaultCustomerLabel: ao?.customer_name,
											defaultVin: em,
											onCreated: (e) => {
												sm(e);
											},
										}),
									],
							  }),
					],
				});
			}
		},
		66669: (e, a, s) => {
			s.d(a, { A: () => t });
			let t = (0, s(90425).A)("gauge", [
				["path", { d: "m12 14 4-4", key: "9kzdfg" }],
				["path", { d: "M3.34 19a10 10 0 1 1 17.32 0", key: "19p75a" }],
			]);
		},
		88361: (e, a, s) => {
			function t(e, a) {
				if ("none" === e) return 0;
				let s = parseFloat(a);
				return Number.isFinite(s) && s > 0 ? s : 0;
			}
			function r(e, a, s) {
				return "none" === a || e <= 0 || s <= 0
					? 0
					: "percentage" === a
					? (Math.min(s, 100) / 100) * e
					: Math.min(s, e);
			}
			function i(e, a) {
				let s = t(e, a);
				if ("none" !== e && !(s <= 0)) return { type: e, value: s };
			}
			function n(e) {
				let a = (e || "").trim().toLowerCase();
				return "percentage" === a || "percent" === a
					? "percentage"
					: "amount" === a
					? "amount"
					: "none";
			}
			function l(e, a) {
				let s = t(e, a);
				return "none" === e || s <= 0
					? { discount_type: "", discount_value: 0 }
					: {
							discount_type:
								"percentage" === e ? "Percentage" : "amount" === e ? "Amount" : "",
							discount_value: s,
					  };
			}
			function c(e, a, s) {
				return r(e, a, s);
			}
			function o(e, a) {
				let s = n(e),
					t = Number(a || 0);
				return "none" === s || t <= 0
					? ""
					: "percentage" === s
					? `${t}%`
					: t.toLocaleString();
			}
			s.d(a, {
				HW: () => r,
				O6: () => c,
				OC: () => l,
				VJ: () => o,
				Z_: () => i,
				mW: () => t,
				nO: () => n,
			});
		},
		89803: (e, a, s) => {
			s.d(a, { b: () => d });
			var t = s(12115);
			s(47650);
			var r = s(42442),
				i = s(95155),
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
				].reduce((e, a) => {
					let s = (0, r.TL)(`Primitive.${a}`),
						n = t.forwardRef((e, t) => {
							let { asChild: r, ...n } = e;
							return (
								"u" > typeof window && (window[Symbol.for("radix-ui")] = !0),
								(0, i.jsx)(r ? s : a, { ...n, ref: t })
							);
						});
					return (n.displayName = `Primitive.${a}`), { ...e, [a]: n };
				}, {}),
				l = "horizontal",
				c = ["horizontal", "vertical"],
				o = t.forwardRef((e, a) => {
					var s;
					let { decorative: t, orientation: r = l, ...o } = e,
						d = ((s = r), c.includes(s)) ? r : l;
					return (0, i.jsx)(n.div, {
						"data-orientation": d,
						...(t
							? { role: "none" }
							: {
									"aria-orientation": "vertical" === d ? d : void 0,
									role: "separator",
							  }),
						...o,
						ref: a,
					});
				});
			o.displayName = "Separator";
			var d = o;
		},
		95964: (e, a, s) => {
			s.d(a, { Q: () => c });
			var t = s(95155),
				r = s(12115),
				i = s(39658),
				n = s(91337);
			function l(e, a) {
				return null == e || Number.isNaN(e) || (a && 0 === e) ? "" : String(e);
			}
			function c({
				value: e,
				onValueChange: a,
				blankWhenZero: s = !0,
				className: o,
				onBlur: d,
				onFocus: m,
				...u
			}) {
				let [h, p] = r.useState(!1),
					[v, _] = r.useState(() => l(e, s));
				return (
					r.useEffect(() => {
						h || _(l(e, s));
					}, [e, h, s]),
					(0, t.jsx)(i.p, {
						...u,
						type: "text",
						inputMode: "decimal",
						className: (0, n.cn)(o),
						value: v,
						onFocus: (e) => {
							p(!0), m?.(e);
						},
						onBlur: (e) => {
							p(!1);
							let t = (function (e) {
								if ("" === e || "." === e || "-" === e || "-." === e) return 0;
								let a = parseFloat(e);
								return Number.isFinite(a) ? a : 0;
							})(v);
							a(t), _(l(t, s)), d?.(e);
						},
						onChange: (e) => {
							let s = e.target.value;
							if (!("" === s || /^-?\d*\.?\d*$/.test(s))) return;
							if ((_(s), "" === s || "." === s || "-" === s || "-." === s))
								return void a(0);
							let t = parseFloat(s);
							Number.isFinite(t) && a(t);
						},
					})
				);
			}
		},
	},
]);
