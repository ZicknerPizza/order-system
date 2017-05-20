package pizza.zickner.ordersystem.web.exception;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import pizza.zickner.ordersystem.core.domain.AggregateNotFoundException;

/**
 * @author Valentin Zickner
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler
    public ResponseEntity<String> handleAggregateNotFoundException(AggregateNotFoundException aggregateNotFoundException) {
        return new ResponseEntity<>(aggregateNotFoundException.getMessage(), new HttpHeaders(), HttpStatus.NOT_FOUND);
    }
}
