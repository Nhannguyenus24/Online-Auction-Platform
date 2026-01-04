package com.auction.entities.record;

import java.util.List;
import com.auction.proto.guest.Category;
import com.auction.proto.guest.PageInfo;
import com.auction.proto.guest.Product;

public record ProductListRecord(List<Product> products, PageInfo pageInfo, Category category) {}
