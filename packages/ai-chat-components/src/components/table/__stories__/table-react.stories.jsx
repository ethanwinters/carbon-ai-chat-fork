/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 *
 *  @license
 */

import React from "react";
import { createComponent } from "@lit/react";
import "../index";
import { CDSAIChatTable } from "../src/table";
import Card from "../../../react/card";
import TableStoriesMeta, {
  Default as DefaultWC,
  Loading as LoadingWC,
} from "./table.stories";

const Table = createComponent({
  tagName: "cds-aichat-table",
  elementClass: CDSAIChatTable,
  react: React,
  events: {
    "cds-table-filtered": "onFilter",
    "cds-pagination-changed-current": "onPageChange",
    "cds-pagination-changed-page-size": "onPageSizeChange",
  },
});

// Helper function to render with or without card wrapper
const renderTable = (args) => {
  const table = (
    <Table
      data-rounded={args.useCard}
      table-title={args.tableTitle}
      table-description={args.tableDescription}
      filter-placeholder-text={args.filterPlaceholderText}
      previous-page-text={args.previousPageText}
      next-page-text={args.nextPageText}
      items-per-page-text={args.itemsPerPageText}
      locale={args.locale}
      default-page-size={args.defaultPageSize}
      headers={args.headers}
      rows={args.rows}
      loading={args.loading}
    />
  );

  return args.useCard ? (
    <Card isFlush>
      <div slot="body">{table}</div>
    </Card>
  ) : (
    table
  );
};

export default {
  title: "Components/Table",
  component: Table,
};

export const Default = {
  argTypes: {
    ...TableStoriesMeta.argTypes,
  },
  args: {
    ...DefaultWC.args,
  },
  render: (args) => renderTable(args),
};

export const Loading = {
  argTypes: {
    ...TableStoriesMeta.argTypes,
  },
  args: {
    ...LoadingWC.args,
  },
  render: (args) => renderTable(args),
};
