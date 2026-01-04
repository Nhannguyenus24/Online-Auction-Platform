package com.auction.entities.record;

import com.auction.proto.guest.PageInfo;
import com.auction.proto.guest.Product;

import java.util.List;

public record ProductListByNameRecord(List<Product> products, PageInfo pageInfo) {}
