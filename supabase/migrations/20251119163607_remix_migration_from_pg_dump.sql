--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: check_order_rate_limit(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_order_rate_limit(client_ip text, max_attempts integer DEFAULT 5, window_hours integer DEFAULT 1) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  current_attempts integer;
  last_attempt timestamp with time zone;
BEGIN
  -- Get current rate limit info
  SELECT attempt_count, last_attempt_at
  INTO current_attempts, last_attempt
  FROM public.order_rate_limit
  WHERE ip_address = client_ip
  AND last_attempt_at > (now() - (window_hours || ' hours')::interval);

  -- If no record or window expired, create/reset
  IF current_attempts IS NULL THEN
    INSERT INTO public.order_rate_limit (ip_address, attempt_count, last_attempt_at)
    VALUES (client_ip, 1, now())
    ON CONFLICT (ip_address) DO UPDATE
    SET attempt_count = 1, last_attempt_at = now();
    RETURN true;
  END IF;

  -- Check if limit exceeded
  IF current_attempts >= max_attempts THEN
    RETURN false;
  END IF;

  -- Increment attempt count
  UPDATE public.order_rate_limit
  SET attempt_count = attempt_count + 1, last_attempt_at = now()
  WHERE ip_address = client_ip;

  RETURN true;
END;
$$;


--
-- Name: generate_order_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_order_code() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate longer random code with full UUID entropy (32 chars)
    new_code := 'PLAZA-' || upper(replace(gen_random_uuid()::text, '-', ''));
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_code;
END;
$$;


--
-- Name: get_order_by_code(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_order_by_code(lookup_code text) RETURNS TABLE(id uuid, order_code text, customer_name text, customer_lastname text, customer_phone text, customer_district text, product_code text, product_name text, product_color text, product_price numeric, status text, created_at timestamp with time zone, updated_at timestamp with time zone, source text, recommended_by text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_code,
    o.customer_name,
    o.customer_lastname,
    o.customer_phone,
    o.customer_district,
    o.product_code,
    o.product_name,
    o.product_color,
    o.product_price,
    o.status,
    o.created_at,
    o.updated_at,
    o.source,
    o.recommended_by
  FROM public.orders o
  WHERE o.order_code = lookup_code
  LIMIT 1;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ai_consumption_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_consumption_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feature text NOT NULL,
    operation_type text NOT NULL,
    tokens_used integer DEFAULT 0,
    api_calls integer DEFAULT 1,
    cost_usd numeric(10,4) DEFAULT 0,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ai_consumption_logs_feature_check CHECK ((feature = ANY (ARRAY['recommendations'::text, 'chatbot'::text, 'forecast'::text])))
);


--
-- Name: inventory_forecast; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_forecast (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_code text NOT NULL,
    forecast_date date NOT NULL,
    predicted_demand integer NOT NULL,
    confidence_level text NOT NULL,
    current_stock integer NOT NULL,
    days_until_stockout integer,
    reorder_alert boolean DEFAULT false,
    suggested_reorder_qty integer,
    calculated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT inventory_forecast_confidence_level_check CHECK ((confidence_level = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])))
);


--
-- Name: order_rate_limit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_rate_limit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address text NOT NULL,
    attempt_count integer DEFAULT 1,
    last_attempt_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_code text NOT NULL,
    customer_name text NOT NULL,
    customer_lastname text NOT NULL,
    customer_phone text NOT NULL,
    customer_district text NOT NULL,
    product_code text NOT NULL,
    product_name text NOT NULL,
    product_color text NOT NULL,
    product_price numeric(10,2) NOT NULL,
    status text DEFAULT 'recibido'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'manual'::text,
    recommended_by text,
    CONSTRAINT orders_source_check CHECK ((source = ANY (ARRAY['manual'::text, 'recommendation'::text, 'chatbot'::text]))),
    CONSTRAINT orders_status_check CHECK ((status = ANY (ARRAY['recibido'::text, 'preparacion'::text, 'enviado'::text, 'entregado'::text, 'cancelado'::text])))
);


--
-- Name: product_similarity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_similarity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id_1 text NOT NULL,
    product_id_2 text NOT NULL,
    similarity_score numeric(3,2) NOT NULL,
    calculated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT product_similarity_similarity_score_check CHECK (((similarity_score >= (0)::numeric) AND (similarity_score <= (1)::numeric)))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_code text NOT NULL,
    nombre_producto text NOT NULL,
    precio numeric(10,2) NOT NULL,
    categoria text NOT NULL,
    imagen_url text,
    cantidad_stock integer DEFAULT 50,
    total_vendido integer DEFAULT 0,
    total_views integer DEFAULT 0,
    total_recommendations integer DEFAULT 0,
    avg_days_to_restock integer DEFAULT 30,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_interactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text NOT NULL,
    user_id uuid,
    product_code text NOT NULL,
    action text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_interactions_action_check CHECK ((action = ANY (ARRAY['view'::text, 'click_recommendation'::text, 'add_to_cart'::text, 'purchase'::text])))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_consumption_logs ai_consumption_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_consumption_logs
    ADD CONSTRAINT ai_consumption_logs_pkey PRIMARY KEY (id);


--
-- Name: inventory_forecast inventory_forecast_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_forecast
    ADD CONSTRAINT inventory_forecast_pkey PRIMARY KEY (id);


--
-- Name: inventory_forecast inventory_forecast_product_code_forecast_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_forecast
    ADD CONSTRAINT inventory_forecast_product_code_forecast_date_key UNIQUE (product_code, forecast_date);


--
-- Name: order_rate_limit order_rate_limit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_rate_limit
    ADD CONSTRAINT order_rate_limit_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_code_key UNIQUE (order_code);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_similarity product_similarity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_similarity
    ADD CONSTRAINT product_similarity_pkey PRIMARY KEY (id);


--
-- Name: product_similarity product_similarity_product_id_1_product_id_2_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_similarity
    ADD CONSTRAINT product_similarity_product_id_1_product_id_2_key UNIQUE (product_id_1, product_id_2);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_product_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_product_code_key UNIQUE (product_code);


--
-- Name: user_interactions user_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_interactions
    ADD CONSTRAINT user_interactions_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_consumption_feature; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consumption_feature ON public.ai_consumption_logs USING btree (feature, created_at DESC);


--
-- Name: idx_forecast_alert; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forecast_alert ON public.inventory_forecast USING btree (reorder_alert, product_code) WHERE (reorder_alert = true);


--
-- Name: idx_forecast_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_forecast_date ON public.inventory_forecast USING btree (forecast_date DESC);


--
-- Name: idx_interactions_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_product ON public.user_interactions USING btree (product_code);


--
-- Name: idx_interactions_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_session ON public.user_interactions USING btree (session_id, created_at DESC);


--
-- Name: idx_order_rate_limit_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_rate_limit_ip ON public.order_rate_limit USING btree (ip_address);


--
-- Name: idx_order_rate_limit_last_attempt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_order_rate_limit_last_attempt ON public.order_rate_limit USING btree (last_attempt_at);


--
-- Name: idx_orders_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_code ON public.orders USING btree (order_code);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at DESC);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_products_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_categoria ON public.products USING btree (categoria);


--
-- Name: idx_products_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_code ON public.products USING btree (product_code);


--
-- Name: idx_similarity_p1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_similarity_p1 ON public.product_similarity USING btree (product_id_1, similarity_score DESC);


--
-- Name: idx_similarity_p2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_similarity_p2 ON public.product_similarity USING btree (product_id_2, similarity_score DESC);


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: orders Allow public order creation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public order creation" ON public.orders FOR INSERT WITH CHECK (true);


--
-- Name: user_interactions Anyone can track interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can track interactions" ON public.user_interactions FOR INSERT WITH CHECK (true);


--
-- Name: orders Only admins can delete orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete orders" ON public.orders FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Only admins can insert products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert products" ON public.products FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Only admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: orders Only admins can update orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: products Only admins can update products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can update products" ON public.products FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ai_consumption_logs Only admins can view AI logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view AI logs" ON public.ai_consumption_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: inventory_forecast Only admins can view forecasts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can view forecasts" ON public.inventory_forecast FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: product_similarity Product similarity is viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Product similarity is viewable by everyone" ON public.product_similarity FOR SELECT USING (true);


--
-- Name: products Products are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);


--
-- Name: order_rate_limit Service role can manage rate limits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage rate limits" ON public.order_rate_limit USING (true) WITH CHECK (true);


--
-- Name: user_interactions Users can view own interactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own interactions" ON public.user_interactions FOR SELECT USING (true);


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: orders View own order by code or admin views all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "View own order by code or admin views all" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ai_consumption_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_consumption_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_forecast; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_forecast ENABLE ROW LEVEL SECURITY;

--
-- Name: order_rate_limit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_rate_limit ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: product_similarity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_similarity ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: user_interactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


