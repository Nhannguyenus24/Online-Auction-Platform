package products.grpc;

import com.salesforce.servicelibs.ReactorServiceGrpc;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import product.service.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl extends ReactorServiceGrpc.ProductServiceImplBase {

    private final ProductGrpcService productGrpcService;

    @Override
    public io.grpc.stub.StreamObserver<GetCategoriesRequest> getCategories(
            io.grpc.stub.StreamObserver<GetCategoriesResponse> responseObserver) {
        return new StreamObserver<GetCategoriesRequest>() {
            @Override
            public void onNext(GetCategoriesRequest request) {
                productGrpcService.getCategories(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in getCategories stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    // Implement all other RPC methods similar to getCategories
    // This skeleton shows the pattern for reactive gRPC implementation

    @Override
    public io.grpc.stub.StreamObserver<CreateCategoryRequest> createCategory(
            io.grpc.stub.StreamObserver<CreateCategoryResponse> responseObserver) {
        return new StreamObserver<CreateCategoryRequest>() {
            @Override
            public void onNext(CreateCategoryRequest request) {
                productGrpcService.createCategory(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in createCategory stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<UpdateCategoryRequest> updateCategory(
            io.grpc.stub.StreamObserver<UpdateCategoryResponse> responseObserver) {
        return new StreamObserver<UpdateCategoryRequest>() {
            @Override
            public void onNext(UpdateCategoryRequest request) {
                productGrpcService.updateCategory(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in updateCategory stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<DeleteCategoryRequest> deleteCategory(
            io.grpc.stub.StreamObserver<DeleteCategoryResponse> responseObserver) {
        return new StreamObserver<DeleteCategoryRequest>() {
            @Override
            public void onNext(DeleteCategoryRequest request) {
                productGrpcService.deleteCategory(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in deleteCategory stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<GetProductDetailsRequest> getProductDetails(
            io.grpc.stub.StreamObserver<GetProductDetailsResponse> responseObserver) {
        return new StreamObserver<GetProductDetailsRequest>() {
            @Override
            public void onNext(GetProductDetailsRequest request) {
                productGrpcService.getProductDetails(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in getProductDetails stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<DeleteProductRequest> deleteProduct(
            io.grpc.stub.StreamObserver<DeleteProductResponse> responseObserver) {
        return new StreamObserver<DeleteProductRequest>() {
            @Override
            public void onNext(DeleteProductRequest request) {
                productGrpcService.deleteProduct(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in deleteProduct stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<GetProductsRequest> getProducts(
            io.grpc.stub.StreamObserver<GetProductsResponse> responseObserver) {
        return new StreamObserver<GetProductsRequest>() {
            @Override
            public void onNext(GetProductsRequest request) {
                productGrpcService.getProducts(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in getProducts stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<SearchProductsRequest> searchProducts(
            io.grpc.stub.StreamObserver<SearchProductsResponse> responseObserver) {
        return new StreamObserver<SearchProductsRequest>() {
            @Override
            public void onNext(SearchProductsRequest request) {
                productGrpcService.searchProducts(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in searchProducts stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<GetCategoryProductsRequest> getCategoryProducts(
            io.grpc.stub.StreamObserver<GetCategoryProductsResponse> responseObserver) {
        return new StreamObserver<GetCategoryProductsRequest>() {
            @Override
            public void onNext(GetCategoryProductsRequest request) {
                productGrpcService.getCategoryProducts(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in getCategoryProducts stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<GetTopProductsRequest> getTopEndingProducts(
            io.grpc.stub.StreamObserver<GetTopProductsResponse> responseObserver) {
        return new StreamObserver<GetTopProductsRequest>() {
            @Override
            public void onNext(GetTopProductsRequest request) {
                productGrpcService.getTopEndingProducts(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in getTopEndingProducts stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<GetTopProductsRequest> getTopBidCountProducts(
            io.grpc.stub.StreamObserver<GetTopProductsResponse> responseObserver) {
        return new StreamObserver<GetTopProductsRequest>() {
            @Override
            public void onNext(GetTopProductsRequest request) {
                productGrpcService.getTopBidCountProducts(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in getTopBidCountProducts stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<GetTopProductsRequest> getTopPriceProducts(
            io.grpc.stub.StreamObserver<GetTopProductsResponse> responseObserver) {
        return new StreamObserver<GetTopProductsRequest>() {
            @Override
            public void onNext(GetTopProductsRequest request) {
                productGrpcService.getTopPriceProducts(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in getTopPriceProducts stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<GetProductHistoryRequest> getProductHistory(
            io.grpc.stub.StreamObserver<GetProductHistoryResponse> responseObserver) {
        return new StreamObserver<GetProductHistoryRequest>() {
            @Override
            public void onNext(GetProductHistoryRequest request) {
                productGrpcService.getProductHistory(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in getProductHistory stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<GetProductQuestionsRequest> getProductQuestions(
            io.grpc.stub.StreamObserver<GetProductQuestionsResponse> responseObserver) {
        return new StreamObserver<GetProductQuestionsRequest>() {
            @Override
            public void onNext(GetProductQuestionsRequest request) {
                productGrpcService.getProductQuestions(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in getProductQuestions stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }

    @Override
    public io.grpc.stub.StreamObserver<GetRelatedProductsRequest> getRelatedProducts(
            io.grpc.stub.StreamObserver<GetRelatedProductsResponse> responseObserver) {
        return new StreamObserver<GetRelatedProductsRequest>() {
            @Override
            public void onNext(GetRelatedProductsRequest request) {
                productGrpcService.getRelatedProducts(request)
                        .subscribe(
                                response -> {
                                    responseObserver.onNext(response);
                                    responseObserver.onCompleted();
                                },
                                error -> responseObserver.onError(error)
                        );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Error in getRelatedProducts stream", t);
            }

            @Override
            public void onCompleted() {
                // No action needed
            }
        };
    }
}
