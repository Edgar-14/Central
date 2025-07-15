import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'shipday/1.0 (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * Retrieve Active Orders
   *
   * @throws FetchError<400, types.RetrieveActiveOrdersResponse400> 400
   */
  retrieveActiveOrders(metadata?: types.RetrieveActiveOrdersMetadataParam): Promise<FetchResponse<200, types.RetrieveActiveOrdersResponse200>> {
    return this.core.fetch('/orders', 'get', metadata);
  }

  /**
   * Insert Order
   *
   * @throws FetchError<400, types.InsertDeliveryOrderResponse400> 400
   */
  insertDeliveryOrder(body: types.InsertDeliveryOrderBodyParam, metadata?: types.InsertDeliveryOrderMetadataParam): Promise<FetchResponse<200, types.InsertDeliveryOrderResponse200>> {
    return this.core.fetch('/orders', 'post', body, metadata);
  }

  /**
   * Retrieve Order Details
   *
   * @throws FetchError<400, types.RetrieveOrderDetailsResponse400> 400
   */
  retrieveOrderDetails(metadata: types.RetrieveOrderDetailsMetadataParam): Promise<FetchResponse<200, types.RetrieveOrderDetailsResponse200>> {
    return this.core.fetch('/orders/{ordernumber}', 'get', metadata);
  }

  /**
   * Orders Query
   *
   * @throws FetchError<400, types.DeliveryOrdersQueryResponse400> 400
   */
  deliveryOrdersQuery(body?: types.DeliveryOrdersQueryBodyParam, metadata?: types.DeliveryOrdersQueryMetadataParam): Promise<FetchResponse<200, types.DeliveryOrdersQueryResponse200>> {
    return this.core.fetch('/orders/query', 'post', body, metadata);
  }

  /**
   * Delete Order
   *
   * @throws FetchError<400, types.DeleteOrderResponse400> 400
   */
  deleteOrder(metadata: types.DeleteOrderMetadataParam): Promise<FetchResponse<204, types.DeleteOrderResponse204>> {
    return this.core.fetch('/orders/{orderId}', 'delete', metadata);
  }

  /**
   * Assign Order to Driver
   *
   * @throws FetchError<400, types.AssignOrderResponse400> 400
   */
  assignOrder(metadata: types.AssignOrderMetadataParam): Promise<FetchResponse<204, types.AssignOrderResponse204>> {
    return this.core.fetch('/orders/assign/{orderId}/{carrierId}', 'put', metadata);
  }

  /**
   * Order Status Update
   *
   * @throws FetchError<400, types.OrderStatusUpdateResponse400> 400
   */
  orderStatusUpdate(body: types.OrderStatusUpdateBodyParam, metadata: types.OrderStatusUpdateMetadataParam): Promise<FetchResponse<200, types.OrderStatusUpdateResponse200>> {
    return this.core.fetch('/orders/{orderId}/status', 'put', body, metadata);
  }

  /**
   * Order Ready to Pickup
   *
   * @throws FetchError<401, types.OrderReadyToPickupResponse401> Unauthorized
   */
  orderReadyToPickup(body: types.OrderReadyToPickupBodyParam, metadata: types.OrderReadyToPickupMetadataParam): Promise<FetchResponse<200, types.OrderReadyToPickupResponse200> | FetchResponse<202, types.OrderReadyToPickupResponse202>> {
    return this.core.fetch('/orders/{orderId}/meta', 'put', body, metadata);
  }

  /**
   * Unassign Order from Driver
   *
   * @throws FetchError<401, types.UnassignOrderFromDriverResponse401> Unauthorized
   */
  unassignOrderFromDriver(metadata: types.UnassignOrderFromDriverMetadataParam): Promise<FetchResponse<200, types.UnassignOrderFromDriverResponse200>> {
    return this.core.fetch('/orders/unassign/{orderId}', 'put', metadata);
  }

  /** @throws FetchError<401, types.GetOrderprogressOrderIdResponse401> Unauthorized */
  get_orderprogressOrderId(metadata: types.GetOrderprogressOrderIdMetadataParam): Promise<FetchResponse<200, types.GetOrderprogressOrderIdResponse200>> {
    return this.core.fetch('/order/progress/{trackingId}', 'get', metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { AssignOrderMetadataParam, AssignOrderResponse204, AssignOrderResponse400, DeleteOrderMetadataParam, DeleteOrderResponse204, DeleteOrderResponse400, DeliveryOrdersQueryBodyParam, DeliveryOrdersQueryMetadataParam, DeliveryOrdersQueryResponse200, DeliveryOrdersQueryResponse400, GetOrderprogressOrderIdMetadataParam, GetOrderprogressOrderIdResponse200, GetOrderprogressOrderIdResponse401, InsertDeliveryOrderBodyParam, InsertDeliveryOrderMetadataParam, InsertDeliveryOrderResponse200, InsertDeliveryOrderResponse400, OrderReadyToPickupBodyParam, OrderReadyToPickupMetadataParam, OrderReadyToPickupResponse200, OrderReadyToPickupResponse202, OrderReadyToPickupResponse401, OrderStatusUpdateBodyParam, OrderStatusUpdateMetadataParam, OrderStatusUpdateResponse200, OrderStatusUpdateResponse400, RetrieveActiveOrdersMetadataParam, RetrieveActiveOrdersResponse200, RetrieveActiveOrdersResponse400, RetrieveOrderDetailsMetadataParam, RetrieveOrderDetailsResponse200, RetrieveOrderDetailsResponse400, UnassignOrderFromDriverMetadataParam, UnassignOrderFromDriverResponse200, UnassignOrderFromDriverResponse401 } from './types';
